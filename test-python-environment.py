#!/usr/bin/env python3
"""
Python Environment Verification Script for FLUENTI Phase 1
Tests the Python virtual environment setup and key packages for model testing
"""

import sys
import importlib
import platform

def test_python_environment():
    print("🐍 Python Environment Verification for FLUENTI Phase 1")
    print("=" * 60)
    
    # Basic Python info
    print(f"Python Version: {platform.python_version()}")
    print(f"Python Executable: {sys.executable}")
    print(f"Platform: {platform.system()} {platform.release()}")
    print(f"Architecture: {platform.architecture()[0]}")
    print()
    
    # Test essential packages
    required_packages = {
        'huggingface_hub': 'Hugging Face Hub client',
        'transformers': 'Hugging Face Transformers library',
        'datasets': 'Hugging Face Datasets library',
        'requests': 'HTTP library for API calls',
        'numpy': 'Numerical computing',
        'scipy': 'Scientific computing',
        'json': 'JSON handling (built-in)',
        'os': 'Operating system interface (built-in)',
        'pathlib': 'Path handling (built-in)'
    }
    
    print("📦 Package Verification:")
    print("-" * 40)
    
    all_good = True
    for package, description in required_packages.items():
        try:
            module = importlib.import_module(package)
            version = getattr(module, '__version__', 'Built-in')
            print(f"✅ {package:<15} {version:<10} - {description}")
        except ImportError as e:
            print(f"❌ {package:<15} MISSING   - {description}")
            all_good = False
    
    print()
    
    # Test Hugging Face Hub connection (if available)
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        print("🤗 Hugging Face Hub Connection Test:")
        print("-" * 40)
        # Test a simple API call (no authentication required)
        model_info = api.model_info("openai/whisper-tiny")
        print(f"✅ Successfully connected to Hugging Face Hub")
        print(f"   Test model: {model_info.id}")
        print(f"   Downloads: {getattr(model_info, 'downloads', 'N/A')}")
    except Exception as e:
        print(f"⚠️  Hugging Face Hub connection test failed: {e}")
        print("   This is normal if no internet connection or API limits")
    
    print()
    
    # Summary
    if all_good:
        print("🎯 Python Environment Status: ✅ READY")
        print("   All required packages are installed and functional")
        print("   Ready for model testing and export operations")
    else:
        print("🔧 Python Environment Status: ⚠️  NEEDS ATTENTION")
        print("   Some required packages are missing")
    
    print("\n" + "=" * 60)
    print("Phase 1 Python Environment Verification Complete!")
    
    return all_good

if __name__ == "__main__":
    test_python_environment()
