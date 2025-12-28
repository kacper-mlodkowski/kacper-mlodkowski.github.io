# Alpha Vantage API Setup Guide

This guide explains how to register for and configure Alpha Vantage API for the investment tracking feature.

## Why Alpha Vantage?

- ✅ **Free Tier**: 500 API calls per day (more than FMP's 250)
- ✅ **Reliable**: Well-established API with good documentation
- ✅ **Comprehensive**: Supports US stocks, ETFs, and international markets
- ✅ **Easy Registration**: Simple signup process
- ✅ **No Credit Card Required**: Free tier available without payment

## Step 1: Register for Alpha Vantage

1. **Go to the registration page**:
   - Visit: https://www.alphavantage.co/support/#api-key
   - Or directly: https://www.alphavantage.co/support/#api-key

2. **Fill out the form**:
   - Enter your first name
   - Enter your last name
   - Enter your email address
   - Click "GET FREE API KEY"

3. **Check your email**:
   - Alpha Vantage will send you an email with your API key
   - The key will look like: `ABC123XYZ789DEF456GHI012JKL345MNO678`

4. **Copy your API key**:
   - The API key is in the email or on the confirmation page
   - **Important**: Keep this key secure and don't share it publicly

## Step 2: Add API Key for Local Development

1. **Create or edit `.env.local` file** in the project root:
   ```bash
   # If file doesn't exist, create it
   touch .env.local
   ```

2. **Add your API key**:
   ```env
   NEXT_PUBLIC_FMP_API_KEY=your_alpha_vantage_api_key_here
   ```
   
   **Note**: We're reusing the `NEXT_PUBLIC_FMP_API_KEY` environment variable name for the Alpha Vantage key.
   
   Replace `your_alpha_vantage_api_key_here` with the actual key from Alpha Vantage.

3. **Example**:
   ```env
   NEXT_PUBLIC_FMP_API_KEY=ABC123XYZ789DEF456GHI012JKL345MNO678
   ```

4. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Step 3: Add API Key for GitHub Pages Deployment

For production builds on GitHub Pages, add the API key as a GitHub Secret:

1. **Go to your GitHub repository**
2. **Navigate to Settings**:
   - Click "Settings" tab in your repository
3. **Go to Secrets**:
   - Click "Secrets and variables" → "Actions"
4. **Add new secret**:
   - Click "New repository secret"
   - **Name**: `NEXT_PUBLIC_FMP_API_KEY`
   - **Value**: Your Alpha Vantage API key
   - Click "Add secret"

## Step 4: Verify GitHub Actions Workflow

The workflow file (`.github/workflows/deploy.yml`) should already be configured with:
```yaml
- name: Build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY }}
    NEXT_PUBLIC_FMP_API_KEY: ${{ secrets.NEXT_PUBLIC_FMP_API_KEY }}
  run: npm run build
```

## Free Tier Limits

- **500 API calls per day** (more generous than FMP's 250)
- **Real-time stock quotes**
- **Historical data**
- **Company fundamentals**
- **ETF data**
- **5 API calls per minute** rate limit

**Note**: If you exceed the limit, you'll need to wait until the next day or upgrade to a paid plan.

## Testing Your Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Go to the Investments page**:
   - Navigate to `/investments` in your browser
   - Make sure you're logged in

3. **Test symbol search**:
   - Click "Add Asset"
   - Type a symbol like "AAPL" or "SPY"
   - You should see autocomplete suggestions appear

4. **Test price fetching**:
   - Add an asset with a symbol
   - Click the "🔄 Refresh Prices" button
   - The price should load
   - Check the browser console (F12) for any errors

## Important: On-Demand Refresh

**Prices are NOT automatically fetched** to prevent rate limiting. You must:
- Click the "🔄 Refresh Prices" button to fetch current prices
- The system batches requests with delays to stay under rate limits
- Only refresh when you actually need updated prices

## Troubleshooting

### "API key not configured" error
- **Check**: Is `NEXT_PUBLIC_FMP_API_KEY` in `.env.local`?
- **Check**: Did you restart the dev server after adding the key?
- **Check**: Is the key spelled correctly (no extra spaces)?

### "401 Unauthorized" or "403 Forbidden" error
- **Check**: Is your API key correct? Copy it again from the email
- **Check**: Did you wait for the email? It may take a few minutes
- **Check**: Is the key active? Try requesting a new one if needed

### "429 Too Many Requests" or rate limit note
- **Cause**: You've exceeded 500 calls per day or 5 calls per minute
- **Solution**: Wait until the next day or reduce refresh frequency
- **Tip**: Use the refresh button sparingly

### Prices not loading
- **Check**: Browser console (F12) for specific error messages
- **Check**: Is the symbol format correct? Try without exchange suffix (e.g., "CSPX" instead of "CSPX.L")
- **Check**: Is the symbol supported? Alpha Vantage primarily supports US markets

### Symbol search not working
- **Check**: API key is set correctly
- **Check**: Browser console for errors
- **Try**: Different symbols (e.g., "AAPL", "MSFT", "SPY")
- **Note**: Alpha Vantage search may have limited results for international symbols

## API Endpoints Used

- **Price Quote**: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={SYMBOL}&apikey={KEY}`
- **Symbol Search**: `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={QUERY}&apikey={KEY}`

## Response Format

**Price Quote Response**:
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "05. price": "273.4000",
    "09. change": "-0.4100",
    "10. change percent": "-0.1497%"
  }
}
```

**Symbol Search Response**:
```json
{
  "bestMatches": [
    {
      "1. symbol": "AAPL",
      "2. name": "Apple Inc."
    }
  ]
}
```

## Support

- **Alpha Vantage Documentation**: https://www.alphavantage.co/documentation/
- **API Key Support**: https://www.alphavantage.co/support/#api-key
- **Status Page**: Check their website if experiencing issues

