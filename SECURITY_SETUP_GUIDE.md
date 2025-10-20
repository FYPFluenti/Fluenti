# Quick Setup Guide for New Security Features

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
npm install speakeasy qrcode @types/speakeasy @types/qrcode nodemailer
```

### 2. Configure Environment Variables

Create or update your `.env` file:

```bash
# Email Service Configuration (Required)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@fluenti.ai

# Application URL
APP_URL=http://localhost:5000

# JWT Secrets (should already be set)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_RESET_SECRET=your-reset-secret

# Database (should already be set)
MONGODB_URI=mongodb://localhost:27017/fluenti
```

### 3. Gmail App-Specific Password Setup

If using Gmail for development:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "Security" → "App passwords"
4. Generate a new app password for "Mail"
5. Copy the password and use it in `EMAIL_PASSWORD`

**Note**: For production, use a proper email service like SendGrid, AWS SES, or Mailgun.

### 4. Start the Server

```bash
npm run dev
```

### 5. Test the Features

#### Test Email Verification:
1. Go to `/signup`
2. Create a new account
3. Check your email for verification link
4. Click the link to verify
5. Try logging in (should work now)

#### Test Password Reset:
1. Go to `/login`
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link
5. Click link and enter new password
6. Login with new password

#### Test Account Lockout:
1. Go to `/login`
2. Enter wrong password 5 times
3. Account should be locked for 30 minutes
4. Check email for lockout notification

#### Test 2FA:
1. Login to your account
2. Go to Settings (you'll need to create this UI)
3. Click "Enable 2FA"
4. Scan QR code with Google Authenticator or Authy
5. Enter the 6-digit code to verify
6. Save the backup codes
7. Logout and login again
8. Enter 2FA code when prompted

---

## 📱 Testing with Development Mode

If you don't have email configured, the system will log emails to console:

```javascript
// In emailService.ts
console.log('📧 [MOCK EMAIL] Would send email:', {
  to: 'user@example.com',
  subject: 'Verify your email',
  preview: '...'
});
```

---

## 🔧 Common Issues

### Issue: Email not sending
**Solution**: 
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, use App-Specific Password
- Check spam folder
- Check server logs for errors

### Issue: "MongoDB not connected"
**Solution**:
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env
- System will use fallback in development mode

### Issue: "Invalid verification token"
**Solution**:
- Token may be expired (24h for verification, 1h for password reset)
- Request a new token
- Check database to verify token was created

### Issue: 2FA QR code not displaying
**Solution**:
- Check if speakeasy and qrcode are installed
- Check browser console for errors
- Verify endpoint is returning qrCode data

---

## 📊 API Endpoints Reference

### Email Verification
- `POST /api/auth/signup` - Creates account and sends verification email
- `GET /api/auth/verify-email?token=xxx` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Password Reset
- `POST /api/auth/forgot-password` - Request reset link
- `POST /api/auth/reset-password` - Reset password with token

### 2FA Management
- `POST /api/auth/2fa/setup` - Initialize 2FA (returns QR code)
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA (requires password)
- `POST /api/auth/2fa/verify-login` - Verify 2FA during login
- `GET /api/auth/2fa/status` - Check if 2FA is enabled
- `POST /api/auth/2fa/regenerate-backup-codes` - Get new backup codes

### Account Status
- `POST /api/auth/login` - Login (handles lockout checking)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user info

---

## 🎨 Frontend Components to Create

You'll need to create UI components for:

### 1. 2FA Setup Modal (in Settings)
```tsx
- Display QR code
- Show secret key (for manual entry)
- Input field for verification code
- Display backup codes
- Download/print backup codes button
```

### 2. 2FA Login Modal
```tsx
- Input field for 6-digit code
- "Use backup code" toggle
- Countdown timer (code expires in 30s)
- "Lost access?" link
```

### 3. Security Settings Page
```tsx
- Email verification status
- 2FA status (enabled/disabled)
- Enable/disable 2FA button
- Regenerate backup codes
- Active sessions list
- Recent login attempts
```

---

## 🧪 Manual Testing Script

```bash
# 1. Test Signup and Email Verification
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "userType": "adult",
    "language": "english"
  }'

# 2. Test Login (should fail - email not verified)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. Test Password Reset Request
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# 4. Test Account Lockout (5 failed attempts)
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrongpassword"
    }'
done
```

---

## 📈 Monitoring and Logs

Check server logs for:
- Email sending status
- Failed login attempts
- Account lockouts
- 2FA setup/verification
- Token generation

Example log output:
```
✅ Email sent successfully to: user@example.com
⚠️  Failed login attempt 3/5 for: user@example.com
🔒 Account locked for: user@example.com
✅ 2FA enabled for user: user-abc123
📧 [MOCK EMAIL] Would send email (development mode)
```

---

## 🔒 Security Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use strong JWT secrets** - Min 64 characters
3. **Enable HTTPS in production** - Required for secure cookies
4. **Use production email service** - Not Gmail
5. **Monitor failed login attempts** - Set up alerts
6. **Regular security audits** - Review logs monthly
7. **User education** - Teach users about 2FA backup codes

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Configure production email service
- [ ] Set strong JWT secrets (64+ chars)
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up email delivery monitoring
- [ ] Create admin unlock tool
- [ ] Test all email templates
- [ ] Test 2FA flow end-to-end
- [ ] Document recovery procedures
- [ ] Train support team

---

## 🆘 Support

If you encounter issues:

1. Check server logs
2. Review environment variables
3. Test with mock emails first
4. Check database connections
5. Verify package installations

For questions or issues, refer to:
- `HIGH_PRIORITY_SECURITY_FEATURES.md` - Detailed documentation
- `AUTH_IMPROVEMENTS_SUMMARY.md` - Previous auth improvements
- `AUTH_SYSTEM_ANALYSIS.md` - System architecture

---

*Setup completed on: October 17, 2025*
