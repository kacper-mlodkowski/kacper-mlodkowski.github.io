# Authentication Flow Explanation

This document explains the complete login and authentication flow in this Next.js application using Supabase Auth.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Structure                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  _app.js (Root)                                              │
│    └── AuthProvider (Context)                                │
│         └── Layout                                           │
│              └── All Pages (Components)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. **Supabase Client** (`lib/supabase.js`)
- Creates a single Supabase client instance
- Uses publishable key (safe for client-side)
- Connects to your Supabase project

### 2. **AuthContext** (`contexts/AuthContext.js`)
- Central authentication state management
- Provides auth functions to all components
- Manages user session state

### 3. **Login Page** (`pages/login.js`)
- Handles both sign up and sign in
- Form submission and error handling

### 4. **Protected Pages** (`pages/users.js`)
- Requires authentication to access
- Redirects to login if not authenticated

### 5. **Layout Component** (`components/Layout.js`)
- Shows/hides navigation based on auth state
- Displays user info and logout button

---

## Complete Authentication Flow

### **Phase 1: Application Initialization**

When the app loads:

1. **`_app.js` wraps everything in `AuthProvider`**
   ```javascript
   <AuthProvider>
     <Layout>
       <Component {...pageProps} />
     </Layout>
   </AuthProvider>
   ```

2. **`AuthProvider` initializes:**
   - Checks for existing session: `supabase.auth.getSession()`
   - Sets up auth state listener: `supabase.auth.onAuthStateChange()`
   - Updates `user` state based on session
   - Sets `loading` to `false` when done

3. **Session Check:**
   - Supabase checks localStorage for existing session tokens
   - If valid session exists → `user` is set
   - If no session → `user` is `null`

---

### **Phase 2: Sign Up Flow**

When a user signs up:

1. **User fills form** (`pages/login.js`)
   - Enters email and password
   - Clicks "Sign Up" button

2. **Form submission:**
   ```javascript
   await signUp(email, password)
   ```

3. **`AuthContext.signUp()` executes:**
   ```javascript
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
   });
   ```
   - Sends request to Supabase Auth API
   - Supabase creates user account
   - Sends verification email (if enabled)

4. **Response handling:**
   - **Success:** Shows green success message
   - **Error:** Shows red error message

5. **Session creation:**
   - Supabase automatically creates a session
   - Session token stored in browser localStorage
   - `onAuthStateChange` listener fires
   - `user` state updates in AuthContext

---

### **Phase 3: Sign In Flow**

When a user signs in:

1. **User fills form** (`pages/login.js`)
   - Enters email and password
   - Clicks "Login" button

2. **Form submission:**
   ```javascript
   await signIn(email, password)
   ```

3. **`AuthContext.signIn()` executes:**
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```
   - Validates credentials with Supabase
   - Creates session if credentials are valid

4. **Response handling:**
   - **Success:** Redirects to `/users` page
   - **Error:** Shows error message

5. **Session established:**
   - Session token stored in localStorage
   - `onAuthStateChange` listener fires
   - `user` state updates
   - All components re-render with new auth state

---

### **Phase 4: Session Management**

**Real-time Auth State Updates:**

The `AuthProvider` listens for auth changes:

```javascript
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
});
```

**Events that trigger updates:**
- `SIGNED_IN` - User logs in
- `SIGNED_OUT` - User logs out
- `TOKEN_REFRESHED` - Session token refreshed
- `USER_UPDATED` - User profile updated
- `PASSWORD_RECOVERY` - Password reset initiated

**Session persistence:**
- Session tokens stored in browser localStorage
- Automatically refreshed by Supabase
- Survives page refreshes

---

### **Phase 5: Protected Routes**

**Example: `/users` page**

1. **Component loads:**
   ```javascript
   const { user, loading: authLoading } = useAuth();
   ```

2. **Auth check:**
   ```javascript
   useEffect(() => {
     if (!authLoading && !user) {
       router.push('/login');
     }
   }, [user, authLoading, router]);
   ```

3. **Behavior:**
   - If `loading` is `true` → Show loading state
   - If `user` is `null` → Redirect to `/login`
   - If `user` exists → Render protected content

4. **Database queries:**
   - Supabase automatically includes auth token in requests
   - RLS policies check if user is authenticated
   - Only authenticated users can insert into `user` table

---

### **Phase 6: UI Updates Based on Auth State**

**Layout Component** (`components/Layout.js`):

1. **Navigation links:**
   ```javascript
   if (user) {
     navLinks.push({ href: '/users', label: 'Users' });
   }
   ```
   - "Users" link only appears when logged in

2. **Auth section:**
   ```javascript
   {user ? (
     <>
       <p>{user.email}</p>
       <button onClick={signOut}>Logout</button>
     </>
   ) : (
     <Link href="/login">Login</Link>
   )}
   ```
   - Shows user email and logout button when authenticated
   - Shows login link when not authenticated

---

### **Phase 7: Logout Flow**

When user clicks logout:

1. **`signOut()` called:**
   ```javascript
   const signOut = async () => {
     const { error } = await supabase.auth.signOut();
     if (error) throw error;
     router.push('/');
   };
   ```

2. **Supabase clears session:**
   - Removes session token from localStorage
   - Invalidates session on server

3. **Auth state updates:**
   - `onAuthStateChange` fires with `SIGNED_OUT` event
   - `user` state set to `null`

4. **UI updates:**
   - Navigation links update (Users link disappears)
   - Auth section shows "Login" button
   - Protected pages redirect to login

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User submits form
       ▼
┌─────────────────┐
│  Login Page     │
│  (pages/login)  │
└──────┬──────────┘
       │
       │ 2. Calls signIn/signUp
       ▼
┌─────────────────┐
│  AuthContext    │
│  (useAuth hook) │
└──────┬──────────┘
       │
       │ 3. Supabase Auth API
       ▼
┌─────────────────┐
│   Supabase      │
│   Auth Service  │
└──────┬──────────┘
       │
       │ 4. Session created
       │    Token stored
       ▼
┌─────────────────┐
│  localStorage   │
│  (Session Token)│
└──────┬──────────┘
       │
       │ 5. onAuthStateChange fires
       ▼
┌─────────────────┐
│  AuthContext    │
│  Updates state  │
└──────┬──────────┘
       │
       │ 6. All components re-render
       ▼
┌─────────────────┐
│  UI Updates     │
│  - Navigation   │
│  - Protected    │
│    pages        │
└─────────────────┘
```

---

## Security Features

### 1. **Row Level Security (RLS)**
- Database-level security
- Policies enforce who can read/write
- Only authenticated users can insert into `user` table

### 2. **Session Tokens**
- JWT tokens stored securely
- Automatically refreshed
- Invalidated on logout

### 3. **Client-Side Protection**
- Protected routes check auth state
- Redirects unauthenticated users
- Hides protected UI elements

### 4. **Server-Side Validation**
- Supabase validates all requests
- RLS policies checked on every query
- Tokens verified before operations

---

## Key Functions

### `useAuth()` Hook
Provides:
- `user` - Current user object (or `null`)
- `loading` - Auth state loading status
- `signIn(email, password)` - Sign in function
- `signUp(email, password)` - Sign up function
- `signOut()` - Sign out function

### Usage Example:
```javascript
const { user, signOut } = useAuth();

if (user) {
  // User is authenticated
  console.log(user.email);
} else {
  // User is not authenticated
}
```

---

## Error Handling

1. **Network errors** - Caught and displayed to user
2. **Invalid credentials** - Error message shown
3. **Session expired** - Auto-redirect to login
4. **RLS violations** - Database returns error

---

## Session Lifecycle

```
┌──────────────┐
│  No Session  │
│  (Logged Out)│
└──────┬───────┘
       │
       │ User signs in
       ▼
┌──────────────┐
│   Session    │
│   Created    │
└──────┬───────┘
       │
       │ Token stored
       │ in localStorage
       ▼
┌──────────────┐
│ Active       │
│ Session      │
│ (Auto-refresh)│
└──────┬───────┘
       │
       │ User logs out
       ▼
┌──────────────┐
│ Session      │
│ Cleared      │
└──────────────┘
```

---

## Summary

1. **Initialization:** App checks for existing session on load
2. **Sign Up:** Creates account, sends verification email
3. **Sign In:** Validates credentials, creates session
4. **Session Management:** Real-time updates via listeners
5. **Protected Routes:** Check auth state, redirect if needed
6. **UI Updates:** Components react to auth state changes
7. **Logout:** Clears session, updates UI

The entire flow is managed by the `AuthContext` which provides a single source of truth for authentication state throughout the application.

