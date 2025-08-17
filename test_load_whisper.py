#!/usr/bin/env python3
"""
FLUENTI Step 4: Auto-Loading Setup Test for Whisper Model
Tests automatic model downloading with HuggingFace transformers pipeline
"""

import os
import time
from dotenv import load_dotenv

print("🎤 FLUENTI Step 4: Testing Auto-Loading with Whisper")
print("=" * 55)

# Load environment variables (including HF_HOME cache)
load_dotenv()

# Display cache configuration
hf_home = os.getenv('HF_HOME')
print(f"📁 HF_HOME Cache Directory: {hf_home}")
print(f"📊 Cache Directory Exists: {os.path.exists(hf_home) if hf_home else False}")

# Check initial cache size
def get_cache_size(directory):
    if not directory or not os.path.exists(directory):
        return 0
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            total_size += os.path.getsize(filepath)
    return total_size

initial_cache_size = get_cache_size(hf_home)
print(f"📦 Initial Cache Size: {initial_cache_size / (1024*1024):.1f} MB")

print("\n🔄 Loading Whisper Model via HuggingFace Pipeline...")
print("   Model: openai/whisper-small (~945MB)")
print("   Note: Will auto-download on first run (requires internet)")

# Record start time
start_time = time.time()

try:
    from transformers import pipeline
    
    print("📥 Creating pipeline (downloading if needed)...")
    # This will auto-download ~945MB to HF_HOME on first run
    pipe = pipeline(
        "automatic-speech-recognition", 
        model="openai/whisper-small"
    )
    
    load_time = time.time() - start_time
    print(f"✅ Whisper loaded successfully!")
    print(f"⏱️  Load time: {load_time:.2f} seconds")
    
    # Test the pipeline with a simple example
    print("\n🧪 Testing pipeline functionality...")
    print("   Model device:", pipe.model.device)
    print("   Model name:", pipe.model.config.name_or_path)
    print("   Model type:", type(pipe.model).__name__)
    
    # Check cache size after loading
    final_cache_size = get_cache_size(hf_home)
    downloaded_size = final_cache_size - initial_cache_size
    
    print(f"\n📊 Cache Statistics:")
    print(f"   Final cache size: {final_cache_size / (1024*1024):.1f} MB")
    print(f"   Downloaded this session: {downloaded_size / (1024*1024):.1f} MB")
    
    if downloaded_size > 100 * 1024 * 1024:  # > 100MB
        print("✅ Model was downloaded and cached successfully!")
    else:
        print("✅ Model was loaded from existing cache!")
    
    # Test audio processing capability (without actual audio)
    print(f"\n🎯 Model Ready for Audio Processing:")
    print("   • Supports multiple languages")
    print("   • Optimized for speech recognition")
    print("   • Cached locally for fast future loads")
    print("   • Ready for FLUENTI emotional therapy sessions")

except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("💡 Make sure transformers is installed: pip install transformers")
    
except Exception as e:
    print(f"❌ Loading Error: {e}")
    print("💡 Common solutions:")
    print("   • Check internet connection for first download")
    print("   • Verify sufficient disk space (~1GB needed)")
    print("   • If behind proxy, set HTTP_PROXY environment variable")
    print("   • Try a smaller model first: 'openai/whisper-tiny'")

print(f"\n🎉 Auto-Loading Test Complete!")
print(f"📁 Models cached in: {hf_home}")
print("🔄 Next runs will load instantly from cache!")
