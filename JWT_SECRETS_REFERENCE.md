---
noteId: "e1ec7220ad9f11f08c9a4dfd044ffb6d"
tags: []

---

# JWT Secrets - Quick Reference

## 🔐 Your Generated JWT Secrets

These secrets are already configured in your `.env` file. **Keep them secure and never commit to Git!**

### Access Token Secret
```
JWT_ACCESS_SECRET=8cb8d902682ad576ee42daf8ffc2eb0c55fb076378a7764aacfcc7904db038e08da8dce4b356557679e73296baa8759a2c1ad3a8997695aa51b8a0fcef9cd247
```

### Refresh Token Secret
```
JWT_REFRESH_SECRET=a4b0d1d4cf35c1d33ca86239319142ff30b2faf504437507dea3ac62a0302465fe8bcaed70b2ea00d9f96ed953b5741aef9793957c4e86261000ca4f7ab0c566
```

### Reset Token Secret
```
JWT_RESET_SECRET=b0b1bb7401f100909fda10c044034c2839d7e270dc22bcaba3c016b9ef6822d759d1400a371c4be1b36e5a54be4a57b6b662b53f6293b2b44ee70a4042621ce5
```

---

## 🔄 How to Regenerate Secrets

If you ever need to generate new secrets (for production, etc.):

```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_RESET_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Or generate all three at once:

```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_RESET_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

---

## ⚠️ Security Best Practices

1. **Never commit .env file to Git**
   - Already in `.gitignore`
   - Check with: `git status`

2. **Use different secrets for production**
   - Generate new secrets for production environment
   - Store securely (env variables in hosting platform)

3. **Rotate secrets periodically**
   - Every 90 days recommended
   - Log out all users when rotating

4. **Keep secrets long and random**
   - Minimum 32 characters
   - Current secrets are 128 characters (very secure)

---

## 📝 Where These Secrets Are Used

- **JWT_ACCESS_SECRET**: Signs and verifies short-lived access tokens (15 minutes)
- **JWT_REFRESH_SECRET**: Signs and verifies long-lived refresh tokens (7 days)
- **JWT_RESET_SECRET**: Signs and verifies password reset tokens (1 hour)

---

## 🚀 Deployment Notes

When deploying to production:

### Option 1: Environment Variables (Recommended)
Set these as environment variables in your hosting platform:
- Netlify: Site settings → Environment variables
- Vercel: Project settings → Environment Variables
- Render: Environment → Environment Variables
- Railway: Variables tab

### Option 2: .env.production
Create a `.env.production` file (never commit to Git):
```bash
NODE_ENV=production
JWT_ACCESS_SECRET=your_production_access_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
JWT_RESET_SECRET=your_production_reset_secret
```

---

## ✅ Verification

To verify your secrets are loaded:

```bash
# In your project directory
node -e "require('dotenv').config(); console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅ Loaded' : '❌ Missing')"
```

---

**Status**: ✅ All secrets generated and configured!
**Location**: `d:\Fluenti\.env` (already configured)
