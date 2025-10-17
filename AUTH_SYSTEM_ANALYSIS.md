# Authentication & Authorization System Analysis

## Overview
Your application uses a **hybrid token-based authentication system** with session support and role-based access control (RBAC). The system handles both authorized and unauthorized users through multiple layers of protection.

---

## 🔐 Authentication Flow

### 1. **User Registration (Signup)**
**File:** `server/auth.ts` → `AuthService.signup()`

**Flow:**
```
Client → POST /api/auth/signup → AuthService.signup()
  ↓
1. Validate required fields (firstName, lastName, email, password, userType, language)
2. Check if user already exists
3. Hash password (bcrypt with 12 salt rounds)
4. Create user in MongoDB with nanoid-generated ID
5. Set session if available
6. Return user + authToken (user ID)
  ↓
Client stores authToken in localStorage
```

**Security Features:**
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Duplicate email prevention
- ✅ Secure session creation
- ✅ Password excluded from response

### 2. **User Login**
**File:** `server/auth.ts` → `AuthService.login()`

**Flow:**
```
Client → POST /api/auth/login → AuthService.login()
  ↓
1. Find user by email
2. Verify password with bcrypt.compare()
3. Set session if available
4. Return user + authToken (user ID)
  ↓
Client stores authToken in localStorage
```

**Security Features:**
- ✅ Generic error messages (prevents username enumeration)
- ✅ Bcrypt password comparison
- ✅ Session-based tracking
- ✅ Token generation

### 3. **Token Extraction**
**File:** `server/middleware.ts` → `extractTokenFromHeader()`

**Flow:**
```
Every Request → extractTokenFromHeader middleware
  ↓
1. Extract "Authorization: Bearer <token>" header
2. Parse token (which is the user ID)
3. Look up user in MongoDB by ID
4. Attach user object to req.user
5. Continue to next middleware
```

**Key Points:**
- 🔄 Runs on **every request** globally
- 🔍 Non-blocking (continues even if token invalid)
- 📌 Attaches user to `req.user` if valid
- 🆔 Token = User ID (simple but functional)

---

## 🛡️ Authorization Mechanisms

### **Server-Side Protection**

#### 1. **tokenBasedAuth Middleware**
**File:** `server/middleware.ts`

```typescript
tokenBasedAuth(req, res, next)
  ↓
Check 1: Session auth? → ✅ Allow
Check 2: Token auth (req.user)? → ✅ Allow
No auth found → ❌ Return 401 Unauthorized
```

**Usage:**
```typescript
// Protect specific routes
app.use('/api/games', tokenBasedAuth, gamesRouter);
app.get('/api/auth/user', tokenBasedAuth, async (req, res) => {...});
app.get('/api/onboarding', tokenBasedAuth, async (req, res) => {...});
```

**Response for Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

#### 2. **Route Protection Pattern**
**File:** `server/routes.ts`

Protected routes follow this pattern:
```typescript
app.get('/api/protected-resource', tokenBasedAuth, async (req, res) => {
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  // Access granted - proceed with logic
});
```

### **Client-Side Protection**

#### 1. **useAuth Hook**
**File:** `client/src/hooks/useAuth.ts`

**Features:**
```typescript
const { user, isLoading, isAuthenticated, logout } = useAuth();
```

- ✅ Monitors localStorage for `authToken`
- ✅ Fetches user data with token
- ✅ Provides authentication state
- ✅ Handles logout (clears storage & cache)
- ✅ Listens for storage events (cross-tab sync)

**Query Configuration:**
```typescript
{
  enabled: !!authToken && isInitialized,  // Only query if token exists
  retry: false,                            // Don't retry on 401
  refetchOnWindowFocus: false,             // Save bandwidth
  staleTime: Infinity,                     // Cache indefinitely
  on401: "returnNull"                      // Return null instead of error
}
```

#### 2. **ProtectedRoute Component**
**File:** `client/src/components/ProtectedRoute.tsx`

**Features:**
- 🚪 Guards routes from unauthorized access
- 👤 Role-based access control (RBAC)
- 🔄 Redirects based on user type
- ⏳ Shows loading state during auth check

**Usage Example:**
```tsx
<Route path="/child-dashboard">
  <ProtectedRoute allowedUserTypes={['child']}>
    <ChildDashboard />
  </ProtectedRoute>
</Route>
```

**Redirect Logic:**
| User Type | Allowed Route | Redirect To |
|-----------|--------------|-------------|
| child | child-dashboard | ✅ Allowed |
| child | adult-dashboard | → child-dashboard |
| adult | emotional-support | ✅ Allowed |
| adult | child-dashboard | → adult-dashboard |
| guest (not authenticated) | any protected | → /login |

---

## 📡 API Request Authentication

### **Client-Side Token Injection**
**File:** `client/src/lib/queryClient.ts`

All API requests automatically include the auth token:

```typescript
const headers: Record<string, string> = {};
const authToken = localStorage.getItem('authToken');
if (authToken) {
  headers["Authorization"] = `Bearer ${authToken}`;
}

fetch(url, {
  headers,
  credentials: "include",  // Include cookies
});
```

**Example Usage in Pages:**
```typescript
// From speech-therapy.tsx
const token = localStorage.getItem('authToken');
const response = await fetch('/api/speech/session', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

---

## 🔒 Security Features

### **Password Security**
1. **Hashing:** bcrypt with 12 salt rounds (very strong)
2. **Storage:** Only hashed passwords in database
3. **Comparison:** Secure bcrypt.compare() for login
4. **Exclusion:** Password never sent to client

### **Token Security**
1. **Storage:** localStorage (persistent across sessions)
2. **Transmission:** Bearer token in Authorization header
3. **Validation:** Server-side lookup in MongoDB
4. **Expiration:** ⚠️ **No expiration** (current limitation)

### **Session Management**
1. **Dual Mode:** Supports both session and token auth
2. **Session Storage:** MongoDB-backed sessions
3. **Fallback:** Token auth works even without sessions

### **Error Handling**
1. **Generic Messages:** "Invalid email or password" (prevents enumeration)
2. **Graceful 401s:** Suppressed in console to reduce noise
3. **Null Returns:** on401: "returnNull" prevents error spam

---

## 🚨 Authorization Failures

### **Unauthorized User Scenarios**

#### 1. **No Token Present**
```
Request → extractTokenFromHeader → No Authorization header
  ↓
req.user = undefined
  ↓
tokenBasedAuth → Return 401 Unauthorized
```

#### 2. **Invalid/Expired Token**
```
Request → extractTokenFromHeader → Token lookup fails
  ↓
req.user = undefined
  ↓
tokenBasedAuth → Return 401 Unauthorized
```

#### 3. **Wrong User Type**
```
Request → ProtectedRoute (client-side)
  ↓
Check allowedUserTypes
  ↓
User type mismatch → Redirect to user's dashboard
```

**Example:**
```typescript
// Adult user tries to access child-only route
<ProtectedRoute allowedUserTypes={['child']}>
  <ChildDashboard />
</ProtectedRoute>
// Result: Redirected to /adult-dashboard
```

#### 4. **Client-Side Redirect Flow**
```typescript
useEffect(() => {
  if (!isLoading) {
    if (!isAuthenticated) {
      setLocation('/login');  // Not logged in
      return;
    }
    if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
      setLocation(`/${userType}-dashboard`);  // Wrong role
    }
  }
}, [isAuthenticated, isLoading, user, allowedUserTypes]);
```

---

## 📊 User Types & Permissions

### **Defined User Types**
```typescript
type UserType = 'child' | 'adult' | 'guardian';
```

### **Permission Matrix**

| Route | child | adult | guardian | Notes |
|-------|-------|-------|----------|-------|
| /login | ✅ | ✅ | ✅ | Public |
| /signup | ✅ | ✅ | ✅ | Public |
| /child-dashboard | ✅ | ❌ | ❌ | Child only |
| /adult-dashboard | ❌ | ✅ | ❌ | Adult only |
| /guardian-dashboard | ❌ | ❌ | ✅ | Guardian only |
| /speech-therapy | ✅ | ✅ | ✅ | All authenticated |
| /emotional-support | ❌ | ✅ | ❌ | Adult only |
| /progress-dashboard | ✅ | ✅ | ✅ | All authenticated |
| /onboarding | ✅ | ✅ | ✅ | All authenticated |
| /settings | ✅ | ✅ | ✅ | All authenticated |

---

## 🔄 Authentication State Management

### **State Flow Diagram**
```
Application Start
  ↓
Check localStorage for authToken
  ↓
Token exists? → Query /api/auth/user
  ↓                    ↓
  Yes                  No
  ↓                    ↓
Fetch user data     Return null
  ↓                    ↓
isAuthenticated = true | false
  ↓
Render appropriate UI
```

### **Cross-Tab Synchronization**
```typescript
// Storage event listener in useAuth
window.addEventListener('storage', handleStorageChange);

// When authToken changes in another tab
if (e.key === 'authToken') {
  setAuthToken(e.newValue);  // Sync state
}
```

---

## ⚠️ Current Limitations & Recommendations

### **Security Concerns**

1. **❌ No Token Expiration**
   - **Issue:** Tokens (user IDs) never expire
   - **Risk:** Stolen tokens valid forever
   - **Fix:** Implement JWT with expiration

2. **❌ Token = User ID**
   - **Issue:** User ID is the token (predictable)
   - **Risk:** Guessable tokens
   - **Fix:** Use cryptographically secure JWT

3. **❌ No Refresh Token**
   - **Issue:** Manual logout only way to invalidate
   - **Risk:** Cannot force logout remotely
   - **Fix:** Implement refresh token mechanism

4. **❌ localStorage for Token Storage**
   - **Issue:** Vulnerable to XSS attacks
   - **Risk:** JavaScript can access token
   - **Fix:** Consider httpOnly cookies for production

### **Missing Features**

1. **🔲 Rate Limiting**
   - No protection against brute force attacks
   - Recommendation: Add express-rate-limit

2. **🔲 Password Reset**
   - No forgot password functionality
   - Recommendation: Implement email-based reset

3. **🔲 Email Verification**
   - Field exists but not enforced
   - Recommendation: Require email verification

4. **🔲 OAuth Implementation**
   - Schema has googleId/facebookId but no routes
   - Recommendation: Complete OAuth integration

5. **🔲 Account Lockout**
   - No protection after failed login attempts
   - Recommendation: Lock account after N failures

### **Code Improvements**

1. **⚠️ Duplicate Index Warnings** ✅ **FIXED**
   - Already removed in schema.ts

2. **⚠️ Dev Mock User**
   - Mock user in production code
   - Recommendation: Remove or environment-gate better

3. **⚠️ Error Suppression**
   - Console.error override may hide real issues
   - Recommendation: Use proper logging library

---

## 🎯 Best Practices Currently Followed

✅ Password hashing (bcrypt)
✅ Generic error messages
✅ Token in Authorization header
✅ Role-based access control
✅ Client-side route protection
✅ Server-side middleware protection
✅ Graceful 401 handling
✅ Cross-tab synchronization
✅ Loading states during auth checks
✅ Query caching for user data

---

## 🔧 Implementation Examples

### **Protecting a New Route**

#### Server-Side
```typescript
// In server/routes.ts
app.get('/api/new-feature', tokenBasedAuth, async (req, res) => {
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Your logic here
  res.json({ data: 'protected data' });
});
```

#### Client-Side
```tsx
// In App.tsx
<Route path="/new-feature">
  <ProtectedRoute allowedUserTypes={['adult']}>
    <NewFeature />
  </ProtectedRoute>
</Route>

// In NewFeature.tsx
import { useAuth } from "@/hooks/useAuth";

function NewFeature() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>Protected content for {user.firstName}</div>;
}
```

### **Making Authenticated API Requests**
```typescript
// Using fetch directly
const token = localStorage.getItem('authToken');
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Using React Query (automatic token injection)
const { data } = useQuery({
  queryKey: ['/api/protected-endpoint'],
  queryFn: getQueryFn({ on401: "returnNull" }),
});
```

---

## 📝 Summary

Your authentication system is **functional and secure for a development environment** but needs enhancements for production:

**Strengths:**
- Strong password hashing
- Dual auth mechanism (session + token)
- Role-based access control
- Good separation of concerns
- Client-side protection layers

**Production TODO:**
1. Implement JWT with expiration
2. Add refresh tokens
3. Implement rate limiting
4. Add email verification
5. Complete OAuth flows
6. Add password reset
7. Consider httpOnly cookies
8. Add audit logging

**Current Status:** ✅ Suitable for MVP/Development | ⚠️ Needs hardening for production
