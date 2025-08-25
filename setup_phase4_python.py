#!/usr/bin/env python3
"""
Phase 4 Python Environment Setup Script
Sets up Python environment for Llama-2 and Coqui TTS integration
"""

import os
import sys
import subprocess
import platform

def run_command(cmd, description=""):
    """Run a command and handle errors."""
    print(f"\n{'='*50}")
    print(f"EXECUTING: {description}")
    print(f"COMMAND: {cmd}")
    print(f"{'='*50}")
    
    try:
        if platform.system() == "Windows":
            # Use shell=True for Windows to handle conda/pip properly
            result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(cmd.split(), check=True, capture_output=True, text=True)
        
        if result.stdout:
            print("OUTPUT:", result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {e}")
        if e.stderr:
            print("STDERR:", e.stderr)
        return False

def check_gpu():
    """Check if CUDA is available."""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✅ CUDA GPU detected: {gpu_name}")
            return True
        else:
            print("⚠️  No CUDA GPU detected, will use CPU")
            return False
    except ImportError:
        print("❌ PyTorch not installed yet")
        return False

def main():
    print("🚀 Fluenti Phase 4 Python Environment Setup")
    print("=" * 60)
    
    # Check Python version
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8+ required for Phase 4")
        sys.exit(1)
    
    # Change to server directory
    server_dir = os.path.join(os.path.dirname(__file__), "server")
    os.chdir(server_dir)
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Install PyTorch with CUDA support for RTX 2050
    print("\n1️⃣ Installing PyTorch with CUDA support...")
    pytorch_cmd = "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121"
    if not run_command(pytorch_cmd, "Install PyTorch with CUDA 12.1"):
        print("⚠️  Falling back to CPU-only PyTorch...")
        run_command("pip install torch torchvision torchaudio", "Install PyTorch CPU")
    
    # Install Transformers and related packages
    print("\n2️⃣ Installing Hugging Face Transformers...")
    transformers_packages = [
        "transformers>=4.36.0",
        "accelerate",
        "bitsandbytes",  # For 8-bit quantization
        "safetensors",
        "tokenizers",
        "sentencepiece"
    ]
    
    for package in transformers_packages:
        run_command(f"pip install {package}", f"Install {package}")
    
    # Install Coqui TTS
    print("\n3️⃣ Installing Coqui TTS...")
    # First try the latest version
    if not run_command("pip install TTS", "Install Coqui TTS"):
        print("⚠️  Trying alternative TTS installation...")
        run_command("pip install coqui-tts", "Install Coqui TTS (alternative)")
    
    # Install additional dependencies
    print("\n4️⃣ Installing additional dependencies...")
    additional_packages = [
        "numpy>=1.21.0",
        "scipy",
        "librosa",
        "soundfile",
        "psutil",
        "pydub",
        "webrtcvad"
    ]
    
    for package in additional_packages:
        run_command(f"pip install {package}", f"Install {package}")
    
    # Install IEMOCAP speech emotion analysis dependencies
    print("\n🎵 Installing IEMOCAP speech emotion dependencies...")
    iemocap_packages = [
        "librosa>=0.9.0",  # Audio feature extraction
        "torch>=1.13.0",   # Already installed above, but ensuring version
        "transformers>=4.21.0",  # Already installed, ensuring compatibility
        "numpy>=1.21.0",   # Already installed
        "scipy>=1.7.0",    # Signal processing
        "scikit-learn",    # ML utilities for IEMOCAP
        "matplotlib",      # Visualization (optional)
        "seaborn"          # Enhanced visualization (optional)
    ]
    
    for package in iemocap_packages:
        run_command(f"pip install {package}", f"Install {package} (IEMOCAP)")
    
    print("✅ IEMOCAP speech emotion analysis dependencies installed")
    print("📊 This enables: tone analysis, stress detection, anxiety detection")
    
    # Test installations
    print("\n5️⃣ Testing installations...")
    test_imports = [
        ("torch", "PyTorch"),
        ("transformers", "Transformers"),
        ("TTS", "Coqui TTS"),
        ("librosa", "Librosa (IEMOCAP)"),
        ("scipy", "SciPy (IEMOCAP)"),
        ("sklearn", "Scikit-learn (IEMOCAP)")
    ]
    
    for module, name in test_imports:
        try:
            __import__(module)
            print(f"✅ {name} imported successfully")
        except ImportError as e:
            print(f"❌ {name} import failed: {e}")
    
    # Check GPU availability
    print("\n6️⃣ Checking GPU availability...")
    check_gpu()
    
    # Create model cache directory
    print("\n7️⃣ Setting up model cache...")
    cache_dir = os.path.join("..", "models", "hf_cache")
    os.makedirs(cache_dir, exist_ok=True)
    print(f"✅ Model cache directory: {cache_dir}")
    
    # Set environment variables
    print("\n8️⃣ Setting up environment variables...")
    env_vars = {
        "HF_HOME": cache_dir,
        "TRANSFORMERS_CACHE": cache_dir,
        "TORCH_HOME": cache_dir
    }
    
    env_file = os.path.join("..", ".env")
    try:
        with open(env_file, "a") as f:
            f.write("\\n# Phase 4 Environment Variables\\n")
            for key, value in env_vars.items():
                f.write(f"{key}={value}\\n")
        print(f"✅ Environment variables added to {env_file}")
    except Exception as e:
        print(f"⚠️  Could not write to .env file: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Phase 4 Python Environment Setup Complete!")
    print("\n📋 Next Steps:")
    print("1. Run the development server: npm run dev")
    print("2. Test Phase 4 features in the Emotional Chat")
    print("3. Monitor model loading in the browser console")
    print("4. Check GPU utilization during inference")
    print("\n⚡ Models will be cached on first use for faster subsequent loads")

if __name__ == "__main__":
    main()
