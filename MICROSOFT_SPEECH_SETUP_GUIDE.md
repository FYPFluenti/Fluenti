# Microsoft Speech API Setup Guide

## Step 1: Create Azure Account (FREE)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Click "Create a free account"**
3. **Sign up with email** (no credit card required for free tier)
4. **Verify your account**

## Step 2: Create Speech Service Resource

1. **In Azure Portal, click "Create a resource"**
2. **Search for "Speech"** and select "Speech"
3. **Click "Create"**
4. **Fill in the details:**
   - Subscription: Your free subscription
   - Resource Group: Create new "speech-therapy-rg"
   - Region: **East US** (important for API calls)
   - Name: "fluenti-speech-service"
   - Pricing Tier: **Free F0** (5 hours/month free)

5. **Click "Review + Create"** then "Create"

## Step 3: Get Your API Keys

1. **After deployment, go to your Speech resource**
2. **Click "Keys and Endpoint" in the left menu**
3. **Copy Key 1** and **Region**

## Step 4: Test Your Setup

You'll have:
- **Speech Key**: something like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Region**: `eastus`
- **Free Tier**: 5 hours of speech recognition per month

## Important Notes:
- ✅ **Completely FREE** for first 5 hours/month
- ✅ **No credit card** required for free tier
- ✅ **Perfect for testing** speech therapy app
- ✅ **Professional grade** pronunciation assessment