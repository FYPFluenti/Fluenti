---
noteId: "e1ed0e62ad9f11f08c9a4dfd044ffb6d"
tags: []

---

# 🎯 Step-by-Step Testing Guide for Security Features

## ✅ Step 1: Configure Gmail for Email Service

### Option A: Use Your Gmail Account (Recommended for Testing)

1. **Go to your Google Account Settings**
   - Visit: https://myaccount.google.com/

2. **Enable 2-Step Verification** (if not already enabled)
   - Go to: Security → 2-Step Verification
   - Follow the steps to enable it

3. **Generate App-Specific Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or Other)
   - Click "Generate"
   - You'll get a 16-character password (like: abcd efgh ijkl mnop)

4. **Update your .env file**
   ```bash
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  # (remove spaces)
   ```

5. **Save the .env file**

### Option B: Test Without Email (Development Mode)

If you don't want to configure email yet:
- The system will log emails to the console instead
- You can still test all features
- Look for `📧 [MOCK EMAIL]` in the terminal

---

## ✅ Step 2: Start the Development Server

Open PowerShell in the Fluenti directory and run:

```powershell
npm run dev
```

Wait for the server to start. You should see:
```
✅ MongoDB connection verified
🚀 Server running on http://localhost:5000
```

---

## ✅ Step 3: Test Email Verification

### 3.1 Create a New Account

1. Open your browser: http://localhost:5000/signup
2. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: your-test-email@gmail.com (or the same email you configured)
   - Password: password123
   - User Type: Adult
   - Language: English
3. Click "Sign Up"

### 3.2 Check for Verification Email

**If Email is Configured:**
- Check your inbox for "✅ Verify your Fluenti account"
- The email should arrive within seconds
- Check spam folder if not in inbox

**If Email is NOT Configured:**
- Check your PowerShell terminal
- Look for: `📧 [MOCK EMAIL] Would send email`
- You'll see the verification link in the logs

### 3.3 Verify Your Email

**With Real Email:**
- Click the "Verify Email Address" button in the email
- OR copy the verification link and paste in browser

**With Mock Email:**
- Copy the verification URL from the console
- Paste it in your browser
- Format: `http://localhost:5000/verify-email?token=xxxxx`

### 3.4 Expected Result

You should see:
- ✅ Green checkmark
- "Email Verified!" message
- Automatic redirect to login page after 3 seconds

### 3.5 Try Logging In

1. Go to: http://localhost:5000/login
2. Enter your email and password
3. Click "Login"
4. ✅ Should successfully login (only works if email is verified)

---

## ✅ Step 4: Test Password Reset Flow

### 4.1 Request Password Reset

1. Go to: http://localhost:5000/login
2. Click "Forgot Password?" link
3. Enter your email address
4. Click "Send Reset Link"

### 4.2 Check Reset Email

**With Email Configured:**
- Check inbox for "🔒 Reset your Fluenti password"
- Email should arrive immediately

**Without Email:**
- Check PowerShell terminal for reset link
- Look for: `📧 [MOCK EMAIL]` with reset URL

### 4.3 Reset Your Password

1. Click the "Reset Password" button in email (or copy URL)
2. You'll be taken to: http://localhost:5000/reset-password?token=xxxxx
3. Enter new password: `newpassword123`
4. Confirm new password: `newpassword123`
5. Click "Reset Password"

### 4.4 Expected Result

- ✅ "Password reset successfully!" message
- Automatic redirect to login
- Old password no longer works
- New password works

### 4.5 Verify Login with New Password

1. Go to login page
2. Use your new password
3. Should login successfully

---

## ✅ Step 5: Test Account Lockout

### 5.1 Attempt Failed Logins

1. Go to: http://localhost:5000/login
2. Enter your email
3. Enter WRONG password: `wrongpassword`
4. Click "Login"
5. **Repeat this 5 times**

### 5.2 Expected Results

**Attempt 1:**
```
❌ Invalid email or password. 4 attempts remaining before account lockout.
```

**Attempt 2:**
```
❌ Invalid email or password. 3 attempts remaining before account lockout.
```

**Attempt 3:**
```
❌ Invalid email or password. 2 attempts remaining before account lockout.
```

**Attempt 4:**
```
❌ Invalid email or password. 1 attempts remaining before account lockout.
```

**Attempt 5:**
```
❌ Too many failed login attempts. Your account has been locked for 30 minutes.
```

### 5.3 Check Lockout Email

- Check inbox for "🔐 Account Security Alert - Account Locked"
- Shows unlock time

### 5.4 Try Logging In During Lockout

1. Wait a few seconds
2. Try logging in with CORRECT password
3. Should see: "Account is locked. Please try again in XX minutes."

### 5.5 Unlock Account (For Testing)

**Option A: Wait 30 minutes** (not recommended for testing!)

**Option B: Reset Password** (recommended)
- Use the password reset flow
- This will unlock your account immediately
- Failed attempt counter will reset to 0

**Option C: Manual Database Unlock** (advanced)
- Connect to MongoDB
- Find your user
- Set `accountLockedUntil` to null
- Set `failedLoginAttempts` to 0

---

## ✅ Step 6: Create 2FA UI Components

Now let's create the 2FA UI. I'll guide you through creating:
1. Settings page with 2FA toggle
2. 2FA setup modal
3. 2FA login modal

### 6.1 Create Settings Page

Create file: `client/src/pages/settings.tsx`

I'll help you create this in the next step. First, let me create a basic settings page structure.

---

## ✅ Step 7: Test 2FA Backend (API Testing)

Before creating the UI, let's test the 2FA backend with curl commands:

### 7.1 Setup 2FA (Get QR Code)

Open a new PowerShell window and run:

```powershell
# First, login to get cookies
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"your-email@gmail.com","password":"your-password"}' -SessionVariable session

# Setup 2FA
$setupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/2fa/setup" -Method POST -WebSession $session -ContentType "application/json"

# Display response
$setupResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

You should see:
```json
{
  "success": true,
  "secret": "ABCD1234EFGH5678...",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": [
    "A3F2-B8D1-4C",
    "D7E9-F1A2-8B",
    ...8 codes total
  ]
}
```

### 7.2 Test QR Code

1. Copy the `qrCode` value (starts with `data:image/png;base64,`)
2. Open a new browser tab
3. Paste the data URL in the address bar
4. You should see a QR code image

### 7.3 Scan with Authenticator App

1. Download Google Authenticator or Authy on your phone
2. Open the app
3. Tap "+" to add new account
4. Scan the QR code
5. You'll see a 6-digit code that changes every 30 seconds

### 7.4 Verify 2FA Code

```powershell
# Use the 6-digit code from your authenticator app
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/2fa/verify" -Method POST -WebSession $session -ContentType "application/json" -Body '{"token":"123456"}'

$verifyResponse.Content | ConvertFrom-Json
```

Expected response:
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

### 7.5 Check 2FA Status

```powershell
$statusResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/2fa/status" -WebSession $session
$statusResponse.Content | ConvertFrom-Json
```

Should return:
```json
{
  "enabled": true
}
```

---

## 📝 Quick Reference: What Works Right Now

✅ **Working Features:**
- Email verification (backend + UI complete)
- Password reset (backend + UI complete)
- Account lockout (backend complete)
- 2FA backend (API complete)

⚠️ **Needs UI:**
- 2FA setup page (in Settings)
- 2FA login modal
- Security dashboard

---

## 🎨 Next: Create 2FA UI

Would you like me to:
1. Create the Settings page with 2FA toggle?
2. Create the 2FA setup modal?
3. Create the 2FA login verification modal?

Let me know which you'd like to tackle first, and I'll create the complete UI components for you!

---

## 🐛 Troubleshooting

### Email not sending?
```powershell
# Check if email service is working
# Look in PowerShell terminal for:
✅ Email sent successfully to: user@example.com
# OR
📧 [MOCK EMAIL] Would send email (development mode)
```

### MongoDB connection error?
```powershell
# Check MongoDB connection
# Look for:
✅ MongoDB connection verified
# OR
⚠️ Continuing without MongoDB (development mode)
```

### Can't see errors?
- Check browser console (F12)
- Check PowerShell terminal for server errors
- Check Network tab in browser DevTools

---

## 📞 Need Help?

If you encounter any issues:
1. Check the PowerShell terminal for errors
2. Check browser console (F12 → Console tab)
3. Verify .env file is saved
4. Restart the server (Ctrl+C, then `npm run dev`)

---

Ready to proceed? Let me know which step you're on!
