#!/bin/bash

echo "🔨 Starting Fluenti build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Only install Python dependencies if explicitly requested
if [ "$INSTALL_PYTHON_DEPS" = "true" ]; then
    echo "🐍 Python dependency installation requested..."
    
    if command -v python3 &> /dev/null; then
        echo "✅ Python3 found: $(python3 --version)"
        
        if [ -f "server/python/requirements.txt" ]; then
            echo "📦 Installing Python dependencies for local STT..."
            pip3 install -r server/python/requirements.txt
        fi
    else
        echo "⚠️ Python3 not found, skipping Python dependencies"
    fi
else
    echo "⚡ Skipping Python dependencies (using cloud STT for production)"
    echo "   Set INSTALL_PYTHON_DEPS=true to install local STT support"
fi

# Build frontend
echo "🏗️ Building frontend..."
npm run build:frontend

# Build backend
echo "🏗️ Building backend..."
npm run build:backend

echo "✅ Build completed!"