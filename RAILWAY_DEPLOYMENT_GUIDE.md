# Railway Deployment Guide for Python Therapy Service

## Issue Analysis

The 502 error "Application failed to respond" occurs because:

1. **Port Configuration**: Railway uses `PORT` environment variable, but the service was checking `THERAPY_PORT` first
2. **Service Detection**: Railway environment wasn't being detected properly
3. **Separate Service**: The Python therapy service needs to be deployed as a **separate service** from the Node.js backend

## ✅ Fixes Applied

1. ✅ Updated port to use Railway's `PORT` environment variable
2. ✅ Added Railway environment detection
3. ✅ Updated Procfile path

## Deployment Steps

### Option 1: Deploy as Separate Service (Recommended)

1. **In Railway Dashboard:**
   - Go to your project
   - Click "New" → "GitHub Repo" (or "Empty Service")
   - Select your repository

2. **Configure the Service:**
   - **Name**: `fluenti-therapy-service` (or any name)
   - **Root Directory**: Leave empty (or set to project root)
   - **Build Command**: `pip install -r server/python/requirements.txt`
   - **Start Command**: `cd server/python && python therapy_service.py`

3. **Set Environment Variables:**
   - `PORT` - Railway sets this automatically (don't set manually)
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `GROQ_API_KEY` - Your Groq API key
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `THERAPY_PRODUCTION` - Set to `true`

4. **Deploy:**
   - Railway will automatically detect and use the `PORT` variable
   - The service will start on the port Railway assigns

### Option 2: Use Railway.json (Alternative)

If you want to use the `railway.json` file I created:

1. Make sure `railway.json` is in your project root
2. Railway will automatically use it for configuration
3. Still set environment variables in Railway dashboard

## Testing After Deployment

Once deployed, test with:

```bash
# Replace with your Railway service URL
python server/python/test_service.py https://your-therapy-service.up.railway.app
```

Or test the health endpoint:
```bash
curl https://your-therapy-service.up.railway.app/health
```

## Common Issues

### 502 Error (Application failed to respond)
- **Cause**: Service not listening on correct port
- **Fix**: Make sure `PORT` environment variable is used (already fixed in code)

### Service crashes on startup
- **Cause**: Missing dependencies or environment variables
- **Fix**: Check Railway logs, ensure all requirements are in `requirements.txt`

### Timeout errors
- **Cause**: Service taking too long to start (dataset loading)
- **Fix**: This is normal for first startup. Wait 2-3 minutes after deployment

## Environment Variables Checklist

Make sure these are set in Railway:

- ✅ `PORT` - Auto-set by Railway (don't set manually)
- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `GROQ_API_KEY` - Groq API key
- ✅ `OPENAI_API_KEY` - OpenAI API key
- ✅ `THERAPY_PRODUCTION` - Set to `true`

## Current Status

After the fixes:
- ✅ Service will use Railway's `PORT` variable
- ✅ Railway environment will be detected
- ✅ Service will start in production mode with Waitress

**Next Step**: Redeploy the service on Railway and test again!

