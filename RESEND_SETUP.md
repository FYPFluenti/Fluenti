# Resend Setup Instructions for Render Email Issue

## The Problem
Render blocks all outbound SMTP connections (ports 25, 587, 465) which prevents Gmail SMTP from working in production, even though it works perfectly locally.

## The Solution
Use Resend, an email service specifically designed to work with hosting platforms like Render and Vercel.

## Setup Steps

### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Free tier includes 3,000 emails/month and 100 emails/day

### 2. Get API Key
1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name like "Fluenti Production"
4. Copy the API key (starts with `re_`)

### 3. Add Environment Variable to Render
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add new environment variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: `your_resend_api_key_here`

### 4. Optional: Verify Domain (for better deliverability)
1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., fluenti.com)
3. Follow DNS verification steps
4. Once verified, you can send from your domain

## How It Works
- **Local Development**: Still uses Gmail SMTP (works fine locally)
- **Production (Render)**: Automatically fails over to Resend SMTP
- **Seamless**: Uses the same nodemailer code, just different transport
- **Reliable**: Resend's SMTP works specifically with Render/Vercel

## Testing
After adding the environment variable and redeploying:
1. Test password reset on production
2. Check logs for: `✅ [EMAIL DEBUG] Successfully connected using Resend SMTP`
3. User should receive the email

## Fallback Order
1. **Resend SMTP** (primary for production)
2. Gmail Service (fallback)
3. Gmail SMTP with requireTLS (fallback)
4. Gmail SMTP with SSL (final fallback)

## Benefits
- ✅ Works with Render out of the box
- ✅ Free tier sufficient for most apps
- ✅ Better deliverability than Gmail
- ✅ No code changes required
- ✅ Professional email service