#!/bin/bash

echo "🔨 Starting Fluenti build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
    
    # Install Python dependencies for STT/TTS
    echo "📦 Installing Python dependencies for STT/TTS..."
    if [ -f "server/python/requirements.txt" ]; then
        echo "Installing from server/python/requirements.txt..."
        pip3 install -r server/python/requirements.txt
    else
        echo "Installing core STT dependencies..."
        pip3 install torch torchvision openai-whisper
    fi
else
    echo "⚠️ Python3 not found, STT features may not work"
fi

# Build frontend
echo "🏗️ Building frontend..."
npm run build:frontend

# Build backend
echo "🏗️ Building backend..."
npm run build:backend

echo "✅ Build completed!"