#!/usr/bin/env python3
"""
FLUENTI: Test Dataset Auto-Loading
Tests HuggingFace datasets auto-download functionality with caching
"""

import os
import time
from dotenv import load_dotenv

print("🧪 FLUENTI: Testing Dataset Auto-Loading")
print("=" * 40)

# Load environment variables (including cache configuration)
load_dotenv()

# Show cache configuration
hf_home = os.getenv('HF_HOME')
print(f"📁 HF Cache Directory: {hf_home}")
print(f"💾 Cache exists: {'✅' if os.path.exists(hf_home) else '❌'}")

print(f"\n📊 Testing Dataset Auto-Loading...")
print("Dataset: GoEmotions (~50MB)")
print("Expected: Auto-download on first run, cache load on subsequent runs")

start_time = time.time()

try:
    from datasets import load_dataset
    
    print(f"\n⏳ Loading GoEmotions dataset...")
    dataset = load_dataset("go_emotions", split="train")
    
    load_time = time.time() - start_time
    
    print(f"✅ GoEmotions loaded successfully!")
    print(f"📊 Dataset size: {len(dataset):,} samples")
    print(f"⏱️  Load time: {load_time:.2f} seconds")
    
    # Show sample data structure
    if len(dataset) > 0:
        sample = dataset[0]
        print(f"\n📝 Sample data structure:")
        for key, value in sample.items():
            if isinstance(value, str):
                preview = value[:50] + "..." if len(value) > 50 else value
                print(f"   {key}: {preview}")
            else:
                print(f"   {key}: {value}")
    
    # Check available emotions
    if hasattr(dataset, 'features'):
        emotions_feature = dataset.features.get('emotions')
        if emotions_feature:
            print(f"\n🎭 Available emotions: {len(emotions_feature.feature.names)} categories")
            print(f"   Categories: {emotions_feature.feature.names[:10]}...")  # Show first 10
    
    print(f"\n🎯 Dataset Auto-Loading: SUCCESS!")
    print(f"💡 Next run will load from cache (~{load_time:.1f}s → ~1-2s)")
    
except Exception as e:
    print(f"❌ Dataset loading failed: {e}")
    print(f"🔧 Troubleshooting:")
    print(f"   1. Check internet connection")
    print(f"   2. Verify HF_HOME cache directory")
    print(f"   3. Ensure sufficient disk space")

print(f"\n📊 DATASET AUTO-LOADING TEST COMPLETE")
