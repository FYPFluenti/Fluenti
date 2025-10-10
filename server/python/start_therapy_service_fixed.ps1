# Enhanced Therapy Service Startup Script
# Fixes common issues and ensures proper environment

Write-Host "🚀 Starting Enhanced Therapy Service..." -ForegroundColor Green
Write-Host "=" -repeat 50 -ForegroundColor Cyan

# Check if virtual environment is activated
if ($env:VIRTUAL_ENV) {
    Write-Host "✅ Virtual environment active: $env:VIRTUAL_ENV" -ForegroundColor Green
} else {
    Write-Host "⚠️ Virtual environment not detected. Activating..." -ForegroundColor Yellow
    try {
        & "D:\Fluenti\.venv\Scripts\Activate.ps1"
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
        Write-Host "   Please run: & D:/Fluenti/.venv/Scripts/Activate.ps1" -ForegroundColor Yellow
        exit 1
    }
}

# Install/update missing dependencies
Write-Host "📦 Checking and installing dependencies..." -ForegroundColor Blue

$dependencies = @(
    "waitress>=2.1.2",
    "langchain-huggingface>=0.0.1"
)

foreach ($dep in $dependencies) {
    Write-Host "   Installing: $dep" -ForegroundColor Cyan
    try {
        pip install $dep --quiet --upgrade
    }
    catch {
        Write-Host "   ⚠️ Failed to install $dep - continuing anyway" -ForegroundColor Yellow
    }
}

# Set environment variables for production mode
$env:THERAPY_PRODUCTION = "true"
$env:FLASK_ENV = "production"

Write-Host "✅ Dependencies check complete" -ForegroundColor Green
Write-Host "" 

# Navigate to the correct directory
Set-Location "D:\Fluenti\server\python"

Write-Host "🔧 Configuration:" -ForegroundColor Magenta
Write-Host "   • Production mode: ON" -ForegroundColor Cyan
Write-Host "   • Server: Waitress (if available)" -ForegroundColor Cyan
Write-Host "   • Logging: Reduced verbosity" -ForegroundColor Cyan
Write-Host "   • Crisis detection: Balanced thresholds" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌟 Starting Therapy Service with fixes..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=" -repeat 50 -ForegroundColor Cyan

try {
    python therapy_service.py
}
catch {
    Write-Host ""
    Write-Host "❌ Service encountered an error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Check if MongoDB is running" -ForegroundColor White
    Write-Host "   2. Verify GROQ_API_KEY is set" -ForegroundColor White
    Write-Host "   3. Ensure all dependencies are installed" -ForegroundColor White
    Write-Host "   4. Check Python environment" -ForegroundColor White
}

Write-Host ""
Write-Host "👋 Therapy service stopped" -ForegroundColor Green