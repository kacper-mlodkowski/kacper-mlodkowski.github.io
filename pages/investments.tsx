import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import styles from '../styles/Investments.module.css';

interface Wallet {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
}

interface Asset {
  id: string;
  wallet_id: string;
  symbol: string;
  asset_type: 'stock' | 'etf' | 'crypto' | 'other';
  quantity: number;
  average_price?: number;
  notes?: string;
  created_at: string;
  current_price?: number;
  total_value?: number;
}

interface PriceData {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
}

export default function Investments() {
  const { user } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [walletForm, setWalletForm] = useState({ name: '', description: '' });
  const [assetForm, setAssetForm] = useState({
    symbol: '',
    asset_type: 'etf' as Asset['asset_type'],
    quantity: '',
    average_price: '',
    notes: '',
  });
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState<Array<{symbol: string, name: string}>>([]);
  const [showSymbolSuggestions, setShowSymbolSuggestions] = useState(false);
  const [searchingSymbol, setSearchingSymbol] = useState(false);
  const symbolSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const symbolAutocompleteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWallets();
  }, [user]);

  useEffect(() => {
    if (selectedWallet) {
      fetchAssets(selectedWallet);
    } else {
      setAssets([]);
    }
  }, [selectedWallet]);

  // Removed automatic price fetching to prevent rate limiting
  // Prices are now fetched only when user clicks the refresh button

  // Close symbol autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (symbolAutocompleteRef.current && !symbolAutocompleteRef.current.contains(event.target as Node)) {
        setShowSymbolSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced symbol search
  useEffect(() => {
    if (symbolSearchTimeoutRef.current) {
      clearTimeout(symbolSearchTimeoutRef.current);
    }

    if (assetForm.symbol.trim().length < 2) {
      setSymbolSuggestions([]);
      setShowSymbolSuggestions(false);
      return;
    }

    symbolSearchTimeoutRef.current = setTimeout(async () => {
      await searchSymbols(assetForm.symbol.trim());
    }, 300);

    return () => {
      if (symbolSearchTimeoutRef.current) {
        clearTimeout(symbolSearchTimeoutRef.current);
      }
    };
  }, [assetForm.symbol]);

  async function fetchWallets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
      if (data && data.length > 0 && !selectedWallet) {
        setSelectedWallet(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssets(walletId: string) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
    }
  }

  async function fetchPrices() {
    if (assets.length === 0) {
      setError('No assets to fetch prices for');
      return;
    }

    setLoadingPrices(true);
    setError(null); // Clear previous errors
    
    const symbols = assets.map(a => a.symbol).filter(Boolean);
    
    if (symbols.length === 0) {
      setLoadingPrices(false);
      return;
    }

    // Batch requests to avoid rate limiting (500 calls/day on Alpha Vantage free tier)
    // Process in smaller batches with delays
    const batchSize = 5; // Process 5 symbols at a time
    const delayBetweenBatches = 2000; // 2 seconds between batches to stay under rate limit
    
    try {
      const priceMap: Record<string, PriceData> = {};
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const pricePromises = batch.map(symbol => fetchPrice(symbol));
        const priceResults = await Promise.all(pricePromises);
        
        priceResults.forEach((result, index) => {
          if (result) {
            priceMap[batch[index]] = result;
          }
        });
        
        // Wait before next batch (except for the last batch)
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      setPrices(priceMap);
      
      // Update assets with current prices
      setAssets(prevAssets => prevAssets.map(asset => {
        const priceData = priceMap[asset.symbol];
        if (priceData) {
          return {
            ...asset,
            current_price: priceData.price,
            total_value: asset.quantity * priceData.price,
          };
        }
        return asset;
      }));
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch some prices. Check console for details.');
    } finally {
      setLoadingPrices(false);
    }
  }

  async function searchSymbols(query: string) {
    if (query.length < 2) {
      setSymbolSuggestions([]);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_FMP_API_KEY; // Reusing env var name for Alpha Vantage key
    
    if (!apiKey) {
      console.error('Alpha Vantage API key not found. Please set NEXT_PUBLIC_FMP_API_KEY in .env.local');
      setSymbolSuggestions([]);
      return;
    }

    try {
      setSearchingSymbol(true);
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`
      );
      
      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        console.error('Alpha Vantage search access denied:', errorText);
        setError('Alpha Vantage API access denied. Check your API key.');
        return;
      }

      if (response.status === 429) {
        setError('Alpha Vantage API rate limit exceeded. Please wait a moment.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Alpha Vantage search returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      // Check for rate limit note
      if (data['Note']) {
        setError('Alpha Vantage API rate limit: ' + data['Note']);
        return;
      }
      
      if (data.bestMatches && Array.isArray(data.bestMatches)) {
        const suggestions = data.bestMatches.slice(0, 5).map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
        }));
        setSymbolSuggestions(suggestions);
        setShowSymbolSuggestions(true);
      } else {
        setSymbolSuggestions([]);
      }
    } catch (err: any) {
      console.error('Error searching symbols with Alpha Vantage:', err.message || err);
      setSymbolSuggestions([]);
    } finally {
      setSearchingSymbol(false);
    }
  }

  async function fetchPrice(symbol: string): Promise<PriceData | null> {
    // Using Alpha Vantage API
    const apiKey = process.env.NEXT_PUBLIC_FMP_API_KEY; // Reusing env var name for Alpha Vantage key
    
    if (!apiKey) {
      console.error('Alpha Vantage API key not found. Please set NEXT_PUBLIC_FMP_API_KEY in .env.local');
      setError('Alpha Vantage API key not configured. Please set NEXT_PUBLIC_FMP_API_KEY in .env.local');
      return null;
    }

    // Normalize symbol - try with and without exchange suffix
    const normalizedSymbol = symbol.toUpperCase().trim();
    const symbolsToTry = [normalizedSymbol];
    
    // If symbol has exchange suffix (e.g., CSPX.L), also try without it
    if (normalizedSymbol.includes('.')) {
      const baseSymbol = normalizedSymbol.split('.')[0];
      symbolsToTry.push(baseSymbol);
    }

    // Try each symbol variant
    for (const symbolToTry of symbolsToTry) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbolToTry)}&apikey=${apiKey}`,
          { 
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (response.status === 401 || response.status === 403) {
          const errorText = await response.text();
          console.error(`Alpha Vantage ${response.status} Forbidden for ${symbolToTry}:`, errorText);
          
          if (symbolToTry === normalizedSymbol) {
            setError(`Alpha Vantage API access denied (${response.status}). Please verify your API key is correct. Get a free key at https://www.alphavantage.co/support/#api-key`);
            return null;
          }
          continue; // Try next symbol variant
        }

        if (response.status === 429) {
          setError('Alpha Vantage API rate limit exceeded (500 calls/day on free tier). Please wait and try again later.');
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Alpha Vantage error ${response.status} for ${symbolToTry}:`, errorText);
          if (symbolToTry === normalizedSymbol && symbolsToTry.length > 1) {
            continue; // Try alternative symbol format
          }
          throw new Error(`Alpha Vantage returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Check for API error messages
        if (data['Error Message']) {
          if (symbolToTry === normalizedSymbol && symbolsToTry.length > 1) {
            continue; // Try alternative symbol format
          }
          throw new Error(data['Error Message']);
        }

        // Check for rate limit note
        if (data['Note']) {
          setError('Alpha Vantage API rate limit: ' + data['Note']);
          return null;
        }

        // Alpha Vantage returns data in 'Global Quote' object
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
          const quote = data['Global Quote'];
          return {
            symbol: normalizedSymbol, // Return original symbol
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change'] || '0'),
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
          };
        }

        // If no data, try next symbol variant
        if (symbolToTry === normalizedSymbol && symbolsToTry.length > 1) {
          continue; // Try alternative symbol format
        }
        
        console.warn(`No price data for ${symbolToTry} from Alpha Vantage`);
        return null;
      } catch (err: any) {
        // If this is the last symbol to try, show error
        if (symbolToTry === symbolsToTry[symbolsToTry.length - 1]) {
          console.error(`Error fetching price for ${normalizedSymbol} from Alpha Vantage:`, err.message || err);
          if (err.message && !err.message.includes('API key')) {
            setError(`Failed to fetch price for ${normalizedSymbol}: ${err.message}`);
          }
        }
        // Otherwise continue to next symbol variant
        continue;
      }
    }

    return null;
  }

  async function handleCreateWallet(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          user_id: user.id,
          name: walletForm.name.trim(),
          description: walletForm.description.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setWallets([data, ...wallets]);
      setSelectedWallet(data.id);
      setWalletForm({ name: '', description: '' });
      setShowWalletForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    }
  }

  async function handleCreateAsset(e: FormEvent) {
    e.preventDefault();
    if (!selectedWallet) return;

    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          wallet_id: selectedWallet,
          symbol: assetForm.symbol.trim().toUpperCase(),
          asset_type: assetForm.asset_type,
          quantity: parseFloat(assetForm.quantity) || 0,
          average_price: assetForm.average_price ? parseFloat(assetForm.average_price) : null,
          notes: assetForm.notes.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAssets([data, ...assets]);
      setAssetForm({
        symbol: '',
        asset_type: 'etf',
        quantity: '',
        average_price: '',
        notes: '',
      });
      setShowAssetForm(false);
      // Don't auto-fetch prices to avoid rate limiting - user can click refresh button
    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
    }
  }

  async function handleDeleteWallet(walletId: string) {
    if (!confirm('Are you sure you want to delete this wallet? All assets will be deleted too.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;
      
      setWallets(wallets.filter(w => w.id !== walletId));
      if (selectedWallet === walletId) {
        setSelectedWallet(wallets.length > 1 ? wallets.find(w => w.id !== walletId)?.id || null : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete wallet');
    }
  }

  async function handleDeleteAsset(assetId: string) {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      
      setAssets(assets.filter(a => a.id !== assetId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
    }
  }

  if (!user) {
    return null;
  }

  const totalPortfolioValue = assets.reduce((sum, asset) => {
    return sum + (asset.total_value || 0);
  }, 0);

  const totalCostBasis = assets.reduce((sum, asset) => {
    return sum + (asset.quantity * (asset.average_price || 0));
  }, 0);

  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  return (
    <>
      <Head>
        <title>Kacper's Website - Investments</title>
        <meta name="description" content="Track your investments" />
      </Head>
      <div className={styles.container}>
        <h1>Investment Portfolio</h1>

        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError(null)} className={styles.closeError}>×</button>
          </div>
        )}

        <div className={styles.walletSection}>
          <div className={styles.walletHeader}>
            <h2>Wallets</h2>
            <button onClick={() => setShowWalletForm(!showWalletForm)} className={styles.addButton}>
              {showWalletForm ? 'Cancel' : '+ New Wallet'}
            </button>
          </div>

          {showWalletForm && (
            <form onSubmit={handleCreateWallet} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Wallet Name *</label>
                <input
                  type="text"
                  value={walletForm.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setWalletForm({ ...walletForm, name: e.target.value })}
                  required
                  placeholder="e.g., Retirement, Trading"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={walletForm.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setWalletForm({ ...walletForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <button type="submit" className={styles.submitButton}>Create Wallet</button>
            </form>
          )}

          <div className={styles.walletList}>
            {wallets.map(wallet => (
              <div
                key={wallet.id}
                className={`${styles.walletCard} ${selectedWallet === wallet.id ? styles.selected : ''}`}
                onClick={() => setSelectedWallet(wallet.id)}
              >
                <div className={styles.walletInfo}>
                  <h3>{wallet.name}</h3>
                  {wallet.description && <p className={styles.walletDescription}>{wallet.description}</p>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWallet(wallet.id);
                  }}
                  className={styles.deleteButton}
                  title="Delete wallet"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedWallet && (
          <div className={styles.assetsSection}>
            <div className={styles.assetsHeader}>
              <h2>Assets</h2>
              <div className={styles.headerButtons}>
                <button 
                  onClick={fetchPrices} 
                  disabled={loadingPrices || assets.length === 0}
                  className={styles.refreshButton}
                  title="Refresh prices (500 calls/day limit on free tier)"
                >
                  {loadingPrices ? 'Refreshing...' : '🔄 Refresh Prices'}
                </button>
                <button onClick={() => setShowAssetForm(!showAssetForm)} className={styles.addButton}>
                  {showAssetForm ? 'Cancel' : '+ Add Asset'}
                </button>
              </div>
            </div>

            {showAssetForm && (
              <form onSubmit={handleCreateAsset} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} ref={symbolAutocompleteRef}>
                    <label>Symbol *</label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        type="text"
                        value={assetForm.symbol}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.toUpperCase();
                          setAssetForm({ ...assetForm, symbol: value });
                          if (value.length >= 2) {
                            setShowSymbolSuggestions(true);
                          }
                        }}
                        onFocus={() => {
                          if (symbolSuggestions.length > 0) {
                            setShowSymbolSuggestions(true);
                          }
                        }}
                        required
                        placeholder="e.g., CSPX, SPY, AAPL"
                        autoComplete="off"
                      />
                      {searchingSymbol && (
                        <span className={styles.searchingIndicator}>Searching...</span>
                      )}
                      {showSymbolSuggestions && symbolSuggestions.length > 0 && (
                        <div className={styles.autocompleteDropdown}>
                          {symbolSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className={styles.autocompleteItem}
                              onClick={() => {
                                setAssetForm({ ...assetForm, symbol: suggestion.symbol });
                                setShowSymbolSuggestions(false);
                                setSymbolSuggestions([]);
                              }}
                            >
                              <div className={styles.autocompleteSymbol}>{suggestion.symbol}</div>
                              <div className={styles.autocompleteName}>{suggestion.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <small className={styles.helpText}>
                      The ticker symbol used on the exchange. For iShares Core S&P 500 UCITS ETF: <strong>CSPX</strong> (US market), <strong>CSPX.L</strong> (London), or <strong>SXR8</strong> (Xetra). Alpha Vantage primarily supports US markets.
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type *</label>
                    <select
                      value={assetForm.asset_type}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setAssetForm({ ...assetForm, asset_type: e.target.value as Asset['asset_type'] })}
                      required
                    >
                      <option value="etf">ETF</option>
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Quantity *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={assetForm.quantity}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Average Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assetForm.average_price}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAssetForm({ ...assetForm, average_price: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Notes</label>
                  <textarea
                    value={assetForm.notes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAssetForm({ ...assetForm, notes: e.target.value })}
                    placeholder="Optional notes"
                    rows={2}
                  />
                </div>
                <button type="submit" className={styles.submitButton}>Add Asset</button>
              </form>
            )}

            {loadingPrices && <p className={styles.loading}>Loading prices... (This may take a moment to avoid rate limits)</p>}

            {!loadingPrices && assets.length > 0 && Object.keys(prices).length === 0 && (
              <div className={styles.priceWarning}>
                <p>Prices not loaded. Click "🔄 Refresh Prices" button above to fetch current prices.</p>
              </div>
            )}

            {assets.length === 0 ? (
              <p className={styles.empty}>No assets in this wallet. Add your first asset above.</p>
            ) : (
              <>
                <div className={styles.summary}>
                  <div className={styles.summaryCard}>
                    <h3>Total Value</h3>
                    <p className={styles.summaryValue}>${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h3>Cost Basis</h3>
                    <p className={styles.summaryValue}>${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h3>Gain/Loss</h3>
                    <p className={`${styles.summaryValue} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                      ${totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      ({totalGainLossPercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>

                <div className={styles.assetsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Avg Price</th>
                        <th>Current Price</th>
                        <th>Total Value</th>
                        <th>Gain/Loss</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map(asset => {
                        const priceData = prices[asset.symbol];
                        const costBasis = asset.quantity * (asset.average_price || 0);
                        const currentValue = asset.total_value || 0;
                        const gainLoss = currentValue - costBasis;
                        const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                        return (
                          <tr key={asset.id}>
                            <td><strong>{asset.symbol}</strong></td>
                            <td>{asset.asset_type.toUpperCase()}</td>
                            <td>{asset.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                            <td>{asset.average_price ? `$${asset.average_price.toFixed(2)}` : 'N/A'}</td>
                            <td>
                              {priceData ? (
                                <span>
                                  ${priceData.price.toFixed(2)}
                                  {priceData.change !== undefined && (
                                    <span className={priceData.change >= 0 ? styles.positive : styles.negative}>
                                      {' '}({priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                'Loading...'
                              )}
                            </td>
                            <td>${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className={gainLoss >= 0 ? styles.positive : styles.negative}>
                              ${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                              ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                            </td>
                            <td>
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className={styles.deleteButton}
                                title="Delete asset"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

