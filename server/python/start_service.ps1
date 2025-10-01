# Emotional Therapy Service Startup Script (PowerShell)
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Emotional Therapy Service Startup" -ForegroundColor Cyan  
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "💡 Install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "therapy_service.py")) {
    Write-Host "❌ therapy_service.py not found" -ForegroundColor Red
    Write-Host "💡 Make sure you're in the server/python directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Service file found" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    pip install flask flask-cors pymongo nltk | Out-Null
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some dependencies may have failed to install" -ForegroundColor Yellow
    Write-Host "🔄 Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Start the service
Write-Host "🚀 Starting Emotional Therapy Service..." -ForegroundColor Cyan
Write-Host "🔗 Service will be available at: http://localhost:5001" -ForegroundColor Cyan
Write-Host "🛑 Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

try {
    python therapy_service.py
} catch {
    Write-Host "❌ Service failed to start" -ForegroundColor Red
    Write-Host "💡 Check the error messages above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Service stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"