# Authentication Type: Token-Based (JWT)

## Answer: **Token-Based Authentication**

Your application uses **token-based authentication** with **JWT (JSON Web Tokens)**, not traditional session-based authentication.

---

## Token-Based vs Session-Based

### **Token-Based (What You're Using) ✅**

**How it works:**
- User logs in → Receives JWT tokens
- Tokens stored in **browser localStorage** (client-side)
- Each API request includes token in headers
- Server validates token on each request
- **Stateless** - no server-side session storage

**Characteristics:**
- ✅ Tokens stored client-side (localStorage)
- ✅ Stateless (no server session storage)
- ✅ Tokens contain user info (JWT payload)
- ✅ Self-contained (token has all needed info)
- ✅ Works across multiple servers/domains

### **Session-Based (Traditional) ❌**

**How it works:**
- User logs in → Server creates session
- Session ID stored in **server memory/database**
- Session ID sent via cookie
- Server looks up session on each request
- **Stateful** - requires server-side storage

**Characteristics:**
- ❌ Session stored server-side
- ❌ Stateful (requires session storage)
- ❌ Session ID is just an identifier
- ❌ Server must look up session data
- ❌ Tied to specific server instance

---

## Your Implementation Details

### **Token Storage**

```javascript
// Tokens stored in browser localStorage
localStorage.getItem('sb-<project-ref>-auth-token')
```

Contains:
- `access_token` - JWT token (short-lived, ~1 hour)
- `refresh_token` - Refresh token (long-lived, ~30 days)
- `expires_at` - Expiration timestamp
- `user` - User information

### **Token Structure (JWT)**

JWT tokens have 3 parts:
```
header.payload.signature
```

**Payload contains:**
- User ID
- Email
- Issued at time
- Expiration time
- Other claims

### **How Requests Work**

```javascript
// 1. User makes request
const { data } = await supabase
  .from('user')
  .select('*');

// 2. Supabase client automatically:
//    - Gets token from localStorage
//    - Adds to request headers: Authorization: Bearer <token>
//    - Sends request to Supabase API

// 3. Supabase server:
//    - Validates JWT token
//    - Extracts user info from token
//    - Checks RLS policies
//    - Returns data
```

---

## Why Supabase Uses "Session" Terminology

Supabase's API uses the term "session" but it's actually **token-based**:

```javascript
// Supabase API calls it "session" but it's really JWT tokens
supabase.auth.getSession()  // Returns JWT tokens
supabase.auth.onAuthStateChange()  // Listens for token changes
```

**Why the confusion?**
- Supabase wraps JWT tokens in a "session" object
- The session object contains the JWT tokens
- It's a convenience abstraction, but still token-based

**What "session" actually means here:**
```javascript
{
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT
  refresh_token: "...",
  expires_at: 1234567890,
  expires_in: 3600,
  user: { ... }
}
```

---

## Key Indicators It's Token-Based

1. **Client-side storage**: Tokens in localStorage (not cookies)
2. **Stateless**: No server-side session storage
3. **JWT format**: Tokens are JWTs (can be decoded)
4. **Self-contained**: Token contains user info
5. **Automatic refresh**: Uses refresh token to get new access token

---

## Comparison Table

| Feature | Token-Based (Your App) | Session-Based |
|---------|----------------------|---------------|
| **Storage Location** | Client (localStorage) | Server (memory/DB) |
| **State** | Stateless | Stateful |
| **Token Type** | JWT (self-contained) | Session ID (identifier) |
| **Server Lookup** | No (validates token) | Yes (looks up session) |
| **Scalability** | High (works across servers) | Lower (needs shared storage) |
| **Mobile/SPA** | Excellent | Limited |
| **CORS** | Easy | Complex |

---

## Security Considerations

### **Token-Based Security:**

✅ **Pros:**
- No server-side storage needed
- Works across multiple servers
- Stateless (easier to scale)
- Can include permissions in token

⚠️ **Cons:**
- Token theft = immediate access (until expiration)
- Can't revoke easily (must wait for expiration)
- Larger request size (token in header)

### **Mitigations in Your App:**

1. **HTTPS only** - Tokens encrypted in transit
2. **Short-lived tokens** - Access tokens expire in 1 hour
3. **Refresh tokens** - Separate, longer-lived tokens
4. **RLS policies** - Database-level security
5. **Token refresh** - Automatic renewal

---

## How to Verify It's Token-Based

You can verify by checking localStorage:

```javascript
// In browser console
localStorage.getItem('sb-<project-ref>-auth-token')
// Returns JSON with access_token (JWT) and refresh_token
```

Or decode the JWT:
```javascript
// JWT tokens can be decoded (header and payload)
// Visit: https://jwt.io
// Paste your access_token to see contents
```

---

## Summary

**Your authentication is:**
- ✅ **Token-based** (JWT)
- ✅ **Stateless** (no server sessions)
- ✅ **Client-stored** (localStorage)
- ✅ **Self-contained** (token has user info)

**Not:**
- ❌ Session-based (no server-side sessions)
- ❌ Cookie-based (uses localStorage, not cookies)
- ❌ Stateful (no server state)

The term "session" in Supabase's API is just a convenience wrapper around JWT tokens - the underlying mechanism is **token-based authentication**.

