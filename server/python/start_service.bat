@echo off
echo ====================================
echo  Emotional Therapy Service Startup
echo ====================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo 💡 Install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

:: Check if we're in the right directory
if not exist "therapy_service.py" (
    echo ❌ therapy_service.py not found
    echo 💡 Make sure you're in the server/python directory
    pause
    exit /b 1
)

echo ✅ Service file found
echo.

:: Install dependencies
echo 📦 Installing dependencies...
pip install flask flask-cors pymongo nltk >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Some dependencies may have failed to install
    echo 🔄 Continuing anyway...
) else (
    echo ✅ Dependencies installed
)

echo.

:: Start the service
echo 🚀 Starting Emotional Therapy Service...
echo 🔗 Service will be available at: http://localhost:5001
echo 🛑 Press Ctrl+C to stop the service
echo.

python therapy_service.py

echo.
echo Service stopped.
pause