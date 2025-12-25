# Supabase Token Refresh/Revalidation

## How Token Refresh Works

Supabase **automatically** handles token refresh in the background. Here's how it works:

## Automatic Token Refresh

### 1. **Built-in Refresh Mechanism**

The Supabase client (`@supabase/supabase-js`) automatically:
- Monitors token expiration
- Refreshes tokens before they expire (typically 1 hour before expiration)
- Updates localStorage with new tokens
- Triggers `TOKEN_REFRESHED` event

### 2. **Token Lifecycle**

```
┌─────────────────────────────────────────┐
│  Access Token (JWT)                     │
│  - Short-lived (default: 1 hour)        │
│  - Used for API requests                │
└─────────────────────────────────────────┘
              │
              │ Expires soon
              ▼
┌─────────────────────────────────────────┐
│  Refresh Token                          │
│  - Long-lived (default: 30 days)        │
│  - Used to get new access tokens        │
└─────────────────────────────────────────┘
              │
              │ Automatically used
              ▼
┌─────────────────────────────────────────┐
│  New Access Token                       │
│  - Fresh token issued                   │
│  - Stored in localStorage               │
└─────────────────────────────────────────┘
```

### 3. **Current Implementation**

In your `AuthContext.js`, the `onAuthStateChange` listener catches refresh events:

```javascript
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
});
```

**Events received:**
- `TOKEN_REFRESHED` - When token is automatically refreshed
- `SIGNED_IN` - When user logs in
- `SIGNED_OUT` - When user logs out
- etc.

However, the current code doesn't explicitly handle the `TOKEN_REFRESHED` event - it just updates the user state, which is fine because the session object contains the refreshed token.

---

## How It Works in Practice

### **Automatic Refresh Process:**

1. **User is logged in** → Access token valid for 1 hour
2. **After ~55 minutes** → Supabase client detects token expiring soon
3. **Automatic refresh** → Uses refresh token to get new access token
4. **Token updated** → New token stored in localStorage
5. **Event fired** → `TOKEN_REFRESHED` event triggered
6. **State updated** → `onAuthStateChange` callback runs
7. **Session updated** → New session with fresh token

### **No User Interruption:**
- Happens **automatically** in the background
- User doesn't notice anything
- No re-login required
- Seamless experience

---

## Enhanced Implementation

If you want to explicitly handle token refresh, you can update `AuthContext.js`:

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
    // Token has been refreshed, session is updated
  }
  
  setUser(session?.user ?? null);
  setLoading(false);
});
```

---

## Token Storage

Tokens are stored in browser localStorage:

```javascript
// Supabase stores tokens here:
localStorage.getItem('sb-<project-ref>-auth-token')
```

Contains:
- `access_token` - Short-lived JWT
- `refresh_token` - Long-lived token for refresh
- `expires_at` - Expiration timestamp
- `expires_in` - Time until expiration

---

## Manual Token Refresh (if needed)

You can manually refresh tokens if needed:

```javascript
const { data, error } = await supabase.auth.refreshSession();
```

But this is **rarely needed** because Supabase handles it automatically.

---

## Token Validation on Requests

Every Supabase request automatically:
1. Checks if token is expired
2. Refreshes if needed (before making request)
3. Includes fresh token in request headers
4. Validates token on server side

This happens **transparently** - you don't need to do anything.

---

## Configuration Options

When creating the Supabase client, you can configure refresh behavior:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,  // Default: true
    persistSession: true,     // Default: true
    detectSessionInUrl: true, // Default: true
  }
})
```

**Current setup** (defaults):
- ✅ `autoRefreshToken: true` - Tokens refresh automatically
- ✅ `persistSession: true` - Session persists across page refreshes
- ✅ `detectSessionInUrl: true` - Detects auth callbacks in URL

---

## Token Expiration Times

Default Supabase token lifetimes:
- **Access Token**: 1 hour
- **Refresh Token**: 30 days (or as configured in Supabase dashboard)

These can be configured in Supabase Dashboard → Authentication → Settings.

---

## What Happens When Token Expires?

### **If refresh token is still valid:**
1. Supabase automatically refreshes
2. User stays logged in
3. No interruption

### **If refresh token expired:**
1. User is logged out
2. `SIGNED_OUT` event fires
3. User needs to log in again

---

## Summary

**Your current implementation:**
- ✅ Relies on Supabase's automatic token refresh
- ✅ Listens to `onAuthStateChange` for updates
- ✅ Updates user state when tokens refresh
- ✅ Works seamlessly without explicit refresh code

**How it works:**
1. Supabase client monitors token expiration
2. Automatically refreshes before expiration
3. Fires `TOKEN_REFRESHED` event
4. Your `onAuthStateChange` listener updates state
5. All components re-render with fresh session

**No additional code needed** - Supabase handles everything automatically! 🎉

