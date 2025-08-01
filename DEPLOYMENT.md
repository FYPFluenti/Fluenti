# Fluenti Deployment Guide

## Overview

Fluenti is a full-stack application that requires both frontend and backend deployment.

## Current Setup

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB + Authentication

## Deployment Options

### Option 1: Split Deployment (Recommended)

#### Frontend (Netlify) ✅

- **Status**: Ready to deploy
- **Service**: Netlify (static hosting)
- **Build Command**: `npx vite build`
- **Publish Directory**: `dist/public`
- **Configuration**: Already configured in `netlify.toml`

#### Backend (Separate Service)

You'll need to deploy the backend to a Node.js hosting service:

**Recommended Services:**

1. **Railway** (easiest)
   - Supports Node.js + MongoDB
   - Automatic deployments from GitHub
   - Built-in environment variables

2. **Render**
   - Free tier available
   - Supports Node.js
   - Easy MongoDB integration

3. **Vercel**
   - Supports Node.js functions
   - Good for full-stack apps

#### Backend Setup Steps

1. Create account on chosen platform
2. Connect your GitHub repository
3. Set environment variables:

   ```env
   MONGODB_URI=your_production_mongodb_uri
   OPENAI_API_KEY=your_openai_key
   SESSION_SECRET=your_secure_session_secret
   NODE_ENV=production
   PORT=3001
   ```

4. Deploy using build command: `npm run build`
5. Start command: `npm start`

#### Frontend Configuration

After deploying the backend, update your frontend API calls to point to the backend URL:

1. Create `client/src/config.ts`:

```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:3001';
```

2.Update API calls in your components to use this base URL.

### Option 2: Full-Stack Deployment

Deploy both frontend and backend together on:

- **Vercel** (supports full-stack Next.js style apps)
- **Railway** (supports Docker deployments)
- **Render** (supports Node.js web services)

## Environment Variables Needed

### Production Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://your-production-mongodb-uri

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Security
SESSION_SECRET=your-64-character-secure-random-string

# App Settings
NODE_ENV=production
PORT=3001
```

## Current Status

- ✅ Build process working
- ✅ Secrets scanning fixed
- ✅ Frontend ready for Netlify
- ✅ Backend code production-ready
- 🔄 Need to deploy backend separately
- 🔄 Need to configure frontend API URLs

## Next Steps

1. Choose a backend hosting service
2. Deploy the backend with environment variables
3. Update frontend API configuration
4. Deploy frontend to Netlify
5. Test the full application

## Local Development

```bash
# Start development server (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server locally
npm start
```
