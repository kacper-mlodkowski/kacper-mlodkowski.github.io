# Financial Modeling Prep (FMP) API Setup Guide

This guide explains how to register for and configure Financial Modeling Prep API for the investment tracking feature.

## Why Financial Modeling Prep?

- ✅ **Free Tier**: 250 API calls per day
- ✅ **Reliable**: Stable API with good uptime
- ✅ **Comprehensive**: Supports US stocks, ETFs, and international markets
- ✅ **Easy Registration**: Simple signup process
- ✅ **No Credit Card Required**: Free tier available without payment

## Step 1: Register for Financial Modeling Prep

1. **Go to the registration page**:
   - Visit: https://site.financialmodelingprep.com/developer/docs/
   - Or directly: https://site.financialmodelingprep.com/register

2. **Sign up**:
   - Click "Sign Up" or "Get Started"
   - Enter your email address
   - Choose a password
   - Complete the registration form

3. **Verify your email**:
   - Check your email inbox
   - Click the verification link sent by Financial Modeling Prep

4. **Log in to your dashboard**:
   - Go to: https://site.financialmodelingprep.com/login
   - Log in with your credentials

## Step 2: Get Your API Key

1. **Navigate to API Key section**:
   - After logging in, go to your dashboard
   - Look for "API Key" or "Developer" section
   - Or visit: https://site.financialmodelingprep.com/dashboard

2. **Copy your API key**:
   - Your API key will look like: `abc123def456ghi789jkl012mno345pqr678`
   - Click "Copy" or manually copy the key
   - **Important**: Keep this key secure and don't share it publicly

## Step 3: Add API Key for Local Development

1. **Create or edit `.env.local` file** in the project root:
   ```bash
   # If file doesn't exist, create it
   touch .env.local
   ```

2. **Add your API key**:
   ```env
   NEXT_PUBLIC_FMP_API_KEY=your_api_key_here
   ```
   
   Replace `your_api_key_here` with the actual key you copied.

3. **Example**:
   ```env
   NEXT_PUBLIC_FMP_API_KEY=abc123def456ghi789jkl012mno345pqr678
   ```

4. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Step 4: Add API Key for GitHub Pages Deployment

For production builds on GitHub Pages, add the API key as a GitHub Secret:

1. **Go to your GitHub repository**
2. **Navigate to Settings**:
   - Click "Settings" tab in your repository
3. **Go to Secrets**:
   - Click "Secrets and variables" → "Actions"
4. **Add new secret**:
   - Click "New repository secret"
   - **Name**: `NEXT_PUBLIC_FMP_API_KEY`
   - **Value**: Your Financial Modeling Prep API key
   - Click "Add secret"

## Step 5: Update GitHub Actions Workflow

The workflow file (`.github/workflows/deploy.yml`) should already be updated, but verify it includes:

```yaml
- name: Build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY }}
    NEXT_PUBLIC_FMP_API_KEY: ${{ secrets.NEXT_PUBLIC_FMP_API_KEY }}
  run: npm run build
```

## Free Tier Limits

- **250 API calls per day**
- **Real-time stock quotes**
- **Historical data**
- **Company fundamentals**
- **ETF data**

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
   - The price should load automatically
   - Check the browser console (F12) for any errors

## Troubleshooting

### "API key not configured" error
- **Check**: Is `NEXT_PUBLIC_FMP_API_KEY` in `.env.local`?
- **Check**: Did you restart the dev server after adding the key?
- **Check**: Is the key spelled correctly (no extra spaces)?

### "401 Unauthorized" or "403 Forbidden" error
- **Check**: Is your API key correct? Copy it again from the dashboard
- **Check**: Is your account active? Log in to verify
- **Check**: Have you exceeded the daily limit? Wait until tomorrow

### "429 Too Many Requests" error
- **Cause**: You've exceeded 250 calls per day
- **Solution**: Wait until the next day or upgrade your plan

### Prices not loading
- **Check**: Browser console (F12) for specific error messages
- **Check**: Is the symbol format correct? Try without exchange suffix (e.g., "CSPX" instead of "CSPX.L")
- **Check**: Is the symbol supported? FMP primarily supports US markets and major international exchanges

### Symbol search not working
- **Check**: API key is set correctly
- **Check**: Browser console for errors
- **Try**: Different symbols (e.g., "AAPL", "MSFT", "SPY")

## Alternative: Upgrade to Paid Plan

If you need more API calls:
- Visit: https://site.financialmodelingprep.com/pricing
- Paid plans start at $14/month
- Includes more API calls and additional features

## Support

- **FMP Documentation**: https://site.financialmodelingprep.com/developer/docs/
- **FMP Support**: Contact through their website dashboard
- **API Status**: Check their status page if experiencing issues

