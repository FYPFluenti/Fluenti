# 🚀 Quick Reference - Security Features

## 📍 Where to Find Everything

### User-Facing Pages:
- **Security Settings**: http://localhost:5000/security
- **Verify Email**: http://localhost:5000/verify-email
- **Reset Password**: http://localhost:5000/reset-password
- **Login**: http://localhost:5000/login
- **Settings**: http://localhost:5000/settings

### Key Files:

#### Backend:
- `server/services/emailService.ts` - Email functionality
- `server/services/twoFactorService.ts` - 2FA/TOTP logic
- `server/auth.ts` - Core auth methods
- `server/routes.ts` - API endpoints
- `server/db/schema.ts` - Database schema

#### Frontend:
- `client/src/pages/security-settings.tsx` - Main security UI
- `client/src/components/TwoFactorModal.tsx` - 2FA login modal
- `client/src/pages/verify-email.tsx` - Email verification
- `client/src/pages/reset-password.tsx` - Password reset
- `client/src/pages/login.tsx` - Login with 2FA
- `client/src/App.tsx` - Routes

## ⚡ Quick Commands

### Start Server:
```powershell
npm run dev
```

### Test Email Sending (PowerShell):
```powershell
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/resend-verification" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Test 2FA Setup (PowerShell):
```powershell
$headers = @{
    Cookie = "authToken=YOUR_TOKEN; refreshToken=YOUR_REFRESH_TOKEN"
}

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/2fa/setup" `
  -Method POST `
  -Body "{}" `
  -Headers $headers `
  -ContentType "application/json"
```

## 🔑 Environment Variables

```env
# Email Service (Required for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Fluenti <your-email@gmail.com>

# Application URL
APP_URL=http://localhost:5000

# JWT Secrets (Already configured)
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## 🎯 Common Tasks

### Enable 2FA:
1. Login → Settings → Security Settings
2. Click "Enable 2FA"
3. Scan QR code
4. Enter verification code
5. Download backup codes

### Test Password Reset:
1. Login page → "Forgot password?"
2. Enter email
3. Check email for reset link
4. Click link and set new password

### Disable 2FA:
1. Security Settings → Click "Disable"
2. Enter your password
3. Confirm

### Resend Verification Email:
1. Go to `/verify-email`
2. Click "Resend verification email"

## 📊 API Endpoints

### Email Verification:
```
POST /api/auth/verify-email
  Body: { token: string }

POST /api/auth/resend-verification
  Body: { email: string }
```

### Password Reset:
```
POST /api/auth/forgot-password
  Body: { email: string }

POST /api/auth/reset-password
  Body: { token: string, password: string }
```

### Two-Factor Auth:
```
POST /api/auth/2fa/setup
  Returns: { qrCode, secret, backupCodes }

POST /api/auth/2fa/verify
  Body: { token: string }

POST /api/auth/2fa/disable
  Body: { password: string }

POST /api/auth/2fa/verify-login
  Body: { token: string, isBackupCode: boolean }

GET /api/auth/2fa/status
  Returns: { enabled: boolean }
```

## 🔒 Security Constants

- **Email Verification Expiry**: 24 hours
- **Password Reset Expiry**: 1 hour
- **Account Lockout**: 5 failed attempts
- **Lockout Duration**: 30 minutes
- **2FA Code Window**: 30 seconds
- **Backup Codes**: 8 codes (one-time use)
- **Password Min Length**: 8 characters
- **JWT Access Token**: 15 minutes
- **JWT Refresh Token**: 7 days

## 🎨 UI Components

### Security Settings Page Features:
- ✅ Email verification status badge
- ✅ 2FA enable/disable with status
- ✅ QR code modal for setup
- ✅ Backup codes display
- ✅ Download backup codes as .txt
- ✅ Step-by-step instructions
- ✅ Password confirmation for disable

### 2FA Modal Features:
- ✅ 6-digit code input
- ✅ Backup code toggle
- ✅ Loading states
- ✅ Error messages
- ✅ Cancel option

## 📱 Authenticator Apps

Compatible with:
- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator (iOS/Android)
- 1Password (with TOTP support)
- Any TOTP-compatible app

## 🐛 Debug Checklist

### Emails not sending?
- [ ] Check .env has EMAIL_* variables
- [ ] Verify Gmail app password
- [ ] Check console for errors
- [ ] Try test email endpoint

### 2FA issues?
- [ ] Time synced on server/client?
- [ ] Authenticator app working?
- [ ] Try backup codes
- [ ] Check 2FA status endpoint

### Login issues?
- [ ] Account locked? (check DB)
- [ ] Email verified?
- [ ] Password correct?
- [ ] 2FA enabled but not providing code?

### Token issues?
- [ ] JWT_SECRET set in .env?
- [ ] Cookies being sent?
- [ ] Token expired?
- [ ] Clear cookies and try again

## 📚 Documentation

1. **FINAL_IMPLEMENTATION_SUMMARY.md** - Complete overview
2. **STEP_BY_STEP_TESTING.md** - Detailed testing guide
3. **HIGH_PRIORITY_SECURITY_FEATURES.md** - Feature specs
4. **SECURITY_SETUP_GUIDE.md** - Configuration guide
5. **QUICK_REFERENCE.md** - This file!

## ⚡ Quick Links

```
Login:              http://localhost:5000/login
Security Settings:  http://localhost:5000/security
Settings:           http://localhost:5000/settings
Verify Email:       http://localhost:5000/verify-email
Reset Password:     http://localhost:5000/reset-password
```

## 🎉 Success Indicators

### Email Verification:
✅ User receives email with link
✅ Clicking link shows success message
✅ User can login after verification

### Password Reset:
✅ User receives reset email
✅ Reset link works (one-time use)
✅ New password works for login

### 2FA Setup:
✅ QR code displays correctly
✅ Authenticator app accepts code
✅ Verification succeeds
✅ Backup codes download

### 2FA Login:
✅ Login prompts for 2FA code
✅ 6-digit code works
✅ Backup code works
✅ Invalid codes rejected

---

**Keep this file handy for quick reference during development and testing!**
