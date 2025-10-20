# Microsoft Speech API Setup Guide

## Step 1: Create Azure Account (FREE)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a free account"
3. Use your existing Microsoft/Gmail/any email
4. **No credit card required** for free tier
5. Complete verification

## Step 2: Create Speech Service Resource

1. In Azure Portal, click "Create a resource"
2. Search for "Speech" 
3. Select "Speech" service
4. Click "Create"

## Step 3: Configure Speech Service

Fill in the form:
- **Subscription**: Free Trial (or existing)
- **Resource Group**: Create new → "fluenti-speech"
- **Region**: East US (recommended)
- **Name**: "fluenti-speech-service"
- **Pricing Tier**: **F0 (FREE)** ← IMPORTANT!

Click "Review + Create" → "Create"

## Step 4: Get Your API Keys

1. After deployment, click "Go to resource"
2. In left menu, click "Keys and Endpoint"
3. Copy **Key 1** and **Region**

## Your Free Limits
- ✅ **5 hours/month** speech recognition
- ✅ **500,000 characters/month** text-to-speech  
- ✅ **5 hours/month** pronunciation assessment
- ✅ No expiration on free tier

## Example Keys (yours will be different):
```
Key: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
Region: eastus
```

Save these - you'll need them in the next step!