#!/usr/bin/env python3
"""
Test script to verify Python environment for Whisper STT
"""
import sys
import os

def check_package(package_name):
    try:
        __import__(package_name)
        print(f"✅ {package_name} is installed")
        return True
    except ImportError:
        print(f"❌ {package_name} is NOT installed")
        return False

def main():
    print("🐍 Checking Python Environment for Whisper STT")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print()
    
    # Check required packages
    packages = ['torch', 'transformers', 'torchaudio']
    all_installed = True
    
    for package in packages:
        if not check_package(package):
            all_installed = False
    
    print()
    
    if all_installed:
        print("🎉 All required packages are installed!")
        
        # Test CUDA availability
        try:
            import torch
            print(f"CUDA available: {torch.cuda.is_available()}")
            if torch.cuda.is_available():
                print(f"CUDA device count: {torch.cuda.device_count()}")
                print(f"Current CUDA device: {torch.cuda.current_device()}")
                print(f"CUDA device name: {torch.cuda.get_device_name()}")
            print(f"PyTorch version: {torch.__version__}")
            
            import transformers
            print(f"Transformers version: {transformers.__version__}")
            
        except Exception as e:
            print(f"Error checking versions: {e}")
    else:
        print("❌ Some required packages are missing.")
        print("Run the following commands to install:")
        print("pip install torch transformers torchaudio")
    
    # Check HF_HOME directory
    hf_home = os.environ.get('HF_HOME', os.path.join(os.getcwd(), 'models', 'hf_cache'))
    print(f"\nHugging Face cache directory: {hf_home}")
    if os.path.exists(hf_home):
        print("✅ HF_HOME directory exists")
    else:
        print("❌ HF_HOME directory does not exist (will be created automatically)")

if __name__ == "__main__":
    main()
