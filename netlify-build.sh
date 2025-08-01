#!/bin/bash
set -e

echo "Starting Netlify build for Fluenti frontend..."

# Ensure we're in the right directory
cd /opt/build/repo

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the frontend
echo "Building frontend with Vite..."
npm run build:frontend

echo "Build completed successfully!"
