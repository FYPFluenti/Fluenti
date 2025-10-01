#!/usr/bin/env python3
"""
Emotional Therapy Service Startup Script
========================================

This script starts the emotional therapy Flask service that provides
AI-powered mental health support through HTTP endpoints.

Usage:
    python start_therapy_service.py

The service will start on http://localhost:5001
"""

import sys
import os
import subprocess
import time

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing Python dependencies...")
    try:
        # Install core dependencies first
        core_deps = [
            "flask==2.3.3",
            "flask-cors==4.0.0",
            "pymongo==4.5.0",
            "nltk==3.8.1"
        ]
        
        print("Installing core dependencies...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install"] + core_deps
        )
        
        # Try to install from requirements.txt for additional deps
        if os.path.exists("requirements.txt"):
            print("Installing additional dependencies from requirements.txt...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ])
        
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print("💡 Try installing manually:")
        print("   pip install flask flask-cors pymongo nltk")
        return False

def start_service():
    """Start the therapy service"""
    print("\n🚀 Starting Emotional Therapy Service...")
    print("🔗 Service will be available at: http://localhost:5001")
    print("📋 Available endpoints:")
    print("  GET  /health                      - Service health check")
    print("  POST /api/therapy/start-session   - Start new therapy session")
    print("  POST /api/therapy/chat            - Send message to therapy bot")
    print("  POST /api/therapy/session-summary - Get session summary")
    print("  GET  /api/therapy/sessions        - List active sessions")
    print("\n" + "="*60)
    
    try:
        # Import and run the service
        from therapy_service import app
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=False,  # Set to False for production
            threaded=True
        )
    except ImportError as e:
        print(f"❌ Failed to import therapy service: {e}")
        print("💡 Make sure all dependencies are installed")
        return False
    except KeyboardInterrupt:
        print("\n\n🛑 Service stopped by user")
        return True
    except Exception as e:
        print(f"❌ Service error: {e}")
        return False

def main():
    """Main startup function"""
    print("🤖 Emotional Therapy Service Startup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
        
    # Start the service
    start_service()

if __name__ == "__main__":
    main()