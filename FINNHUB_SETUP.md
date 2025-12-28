# Finnhub API Setup Guide

Finnhub support is already implemented in the code. To enable it, you need to add your API key.

## What's Already Implemented

✅ Finnhub price fetching (`fetchPriceFromFinnhub`)
✅ Finnhub symbol search (`searchSymbolsFinnhub`)
✅ Automatic fallback if API key is missing (uses 'demo' key, which has limited functionality)

## Steps to Enable Finnhub

### 1. Get a Free Finnhub API Key

1. Go to https://finnhub.io/register
2. Sign up for a free account
3. After registration, go to your dashboard
4. Copy your API key (it looks like: `c1234567890abcdefghij`)

**Free Tier Limits:**
- 60 API calls per minute
- Real-time stock quotes
- Company fundamentals
- News and sentiment data

### 2. Add API Key for Local Development

Create or edit `.env.local` in the project root:

```env
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
```

**Note:** The `.env.local` file is already in `.gitignore`, so it won't be committed to Git.

### 3. Add API Key for GitHub Pages Deployment

For the production build on GitHub Pages, you need to add the API key as a GitHub Secret:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NEXT_PUBLIC_FINNHUB_API_KEY`
5. Value: Your Finnhub API key
6. Click **Add secret**

### 4. Update GitHub Actions Workflow

Update `.github/workflows/deploy.yml` to include the Finnhub API key in the build step:

```yaml
- name: Build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY }}
    NEXT_PUBLIC_FINNHUB_API_KEY: ${{ secrets.NEXT_PUBLIC_FINNHUB_API_KEY }}
  run: npm run build
```

## How It Works

1. **Price Fetching**: When fetching prices, the system tries providers in this order:
   - Yahoo Finance (no API key needed)
   - **Finnhub** (if API key is set)
   - Financial Modeling Prep
   - Polygon.io
   - MarketStack

2. **Symbol Search**: When searching for symbols, it tries:
   - Yahoo Finance (no API key needed)
   - Financial Modeling Prep
   - **Finnhub** (if API key is set)

3. **Fallback Behavior**: If the Finnhub API key is not set or invalid, the system automatically falls back to other providers. The app will still work, but may be slower or less reliable.

## Testing

After adding your API key:

1. Restart your development server: `npm run dev`
2. Go to the Investments page
3. Try adding a symbol (e.g., "AAPL" or "SPY")
4. Check the browser console for any API errors
5. Verify that prices are loading correctly

## Troubleshooting

- **"Finnhub returned 401"**: Invalid API key - check that you copied it correctly
- **"Finnhub returned 429"**: Rate limit exceeded - wait a minute and try again
- **Prices not loading**: Check browser console for specific error messages
- **Still using Yahoo Finance**: This is normal - Yahoo Finance is tried first. Finnhub is used as a fallback if Yahoo fails.

## Optional: Other API Keys

You can also add these for additional fallback options:

```env
NEXT_PUBLIC_FMP_API_KEY=your_fmp_key
NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_key
NEXT_PUBLIC_MARKETSTACK_API_KEY=your_marketstack_key
```

Each provider has different free tier limits, so having multiple keys provides better reliability.

