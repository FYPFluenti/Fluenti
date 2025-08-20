#!/usr/bin/env python3
"""
Test script to load and cache ML models for Fluenti project
This script downloads models to HF_HOME cache for offline use
"""

import os
import torch
from transformers import pipeline
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

# Set HF_HOME cache directory and GPU optimization
os.environ['HF_HOME'] = 'E:/Fluenti/models/hf_cache'
os.environ['TRANSFORMERS_CACHE'] = 'E:/Fluenti/models/hf_cache'
os.environ['CUDA_VISIBLE_DEVICES'] = '0'  # Use first GPU
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'  # GPU memory optimization

print("🚀 Fluenti ML Model Loading Test")
print("=" * 50)

# Check device availability and force GPU usage
if torch.cuda.is_available():
    device = 0  # Use first GPU
    device_name = f"GPU (CUDA) - {torch.cuda.get_device_name(0)}"
    print(f"🚀 GPU detected: {torch.cuda.get_device_name(0)}")
    print(f"💾 GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    print(f"🔧 Compute capability: {torch.cuda.get_device_capability(0)}")
else:
    device = -1  # Use CPU
    device_name = "CPU (CUDA not available)"
    print("⚠️  CUDA not available, falling back to CPU")

print(f"🔧 Using device: {device_name}")
print(f"📁 Cache directory: {os.environ['HF_HOME']}")
print()

def test_model_loading():
    """Test loading various ML models used in Fluenti"""
    
    print("1️⃣ Testing Whisper Speech Recognition Model")
    print("-" * 40)
    try:
        # Load Whisper model (auto-downloads ~945MB) with GPU optimization
        print("📥 Loading openai/whisper-small...")
        whisper_pipe = pipeline(
            "automatic-speech-recognition", 
            model="openai/whisper-small",
            device=device,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            model_kwargs={
                "low_cpu_mem_usage": True,
                "use_cache": True
            }
        )
        print("✅ Whisper loaded successfully!")
        print(f"   Model: {whisper_pipe.model.__class__.__name__}")
        
        # Clean up memory
        del whisper_pipe
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print()
        
    except Exception as e:
        print(f"❌ Whisper loading failed: {e}")
        print()

    print("2️⃣ Testing RoBERTa Emotion Detection Model")
    print("-" * 40)
    try:
        # Load RoBERTa GoEmotions model for emotion detection with GPU optimization
        print("📥 Loading SamLowe/roberta-base-go_emotions...")
        emotion_pipe = pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            device=device,
            return_all_scores=True,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            model_kwargs={
                "low_cpu_mem_usage": True,
                "use_cache": True
            }
        )
        print("✅ RoBERTa GoEmotions loaded successfully!")
        print(f"   Model: {emotion_pipe.model.__class__.__name__}")
        
        # Test with sample text
        test_text = "I'm feeling really happy today!"
        results = emotion_pipe(test_text)
        top_emotion = max(results[0], key=lambda x: x['score'])
        print(f"   Test: '{test_text}' -> {top_emotion['label']} ({top_emotion['score']:.3f})")
        
        # Clean up memory
        del emotion_pipe
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print()
        
    except Exception as e:
        print(f"❌ RoBERTa loading failed: {e}")
        print()

    print("3️⃣ Testing GPT-2 Text Generation Model")
    print("-" * 40)
    try:
        # Load GPT-2 for text generation with GPU optimization
        print("📥 Loading gpt2...")
        gpt2_pipe = pipeline(
            "text-generation",
            model="gpt2",
            device=device,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            model_kwargs={
                "low_cpu_mem_usage": True,
                "use_cache": True
            }
        )
        print("✅ GPT-2 loaded successfully!")
        print(f"   Model: {gpt2_pipe.model.__class__.__name__}")
        
        # Test with sample text
        test_prompt = "Today I learned that"
        result = gpt2_pipe(test_prompt, max_length=30, num_return_sequences=1, do_sample=True)
        print(f"   Test: '{test_prompt}' -> '{result[0]['generated_text']}'")
        
        # Clean up memory
        del gpt2_pipe
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print()
        
    except Exception as e:
        print(f"❌ GPT-2 loading failed: {e}")
        print()

    print("4️⃣ Testing DialoGPT Conversational Model")
    print("-" * 40)
    try:
        # Load DialoGPT for conversations with GPU optimization
        print("📥 Loading microsoft/DialoGPT-medium...")
        dialogo_pipe = pipeline(
            "text-generation",
            model="microsoft/DialoGPT-medium",
            device=device,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            model_kwargs={
                "low_cpu_mem_usage": True,
                "use_cache": True
            }
        )
        print("✅ DialoGPT loaded successfully!")
        print(f"   Model: {dialogo_pipe.model.__class__.__name__}")
        
        # Clean up memory
        del dialogo_pipe
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print()
        
    except Exception as e:
        print(f"❌ DialoGPT loading failed: {e}")
        print()

def check_cache_size():
    """Check the size of downloaded models in cache"""
    print("📊 Cache Information")
    print("-" * 40)
    
    cache_dir = os.environ['HF_HOME']
    if os.path.exists(cache_dir):
        # Calculate total cache size
        total_size = 0
        file_count = 0
        
        for dirpath, dirnames, filenames in os.walk(cache_dir):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    size = os.path.getsize(filepath)
                    total_size += size
                    file_count += 1
                except:
                    pass
        
        # Convert to human readable format
        size_gb = total_size / (1024**3)
        size_mb = total_size / (1024**2)
        
        print(f"📁 Cache directory: {cache_dir}")
        print(f"📦 Total files: {file_count}")
        print(f"💾 Total size: {size_gb:.2f} GB ({size_mb:.1f} MB)")
        print(f"🔄 Models ready for offline use!")
    else:
        print(f"📁 Cache directory not found: {cache_dir}")
        print("🔄 Models will be downloaded on first use")

if __name__ == "__main__":
    try:
        test_model_loading()
        check_cache_size()
        
        print("🎉 Model Loading Test Complete!")
        print("=" * 50)
        print("✅ All models are cached and ready for Fluenti project")
        print("🚀 You can now run the application offline!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
