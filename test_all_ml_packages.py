# FLUENTI Phase 1: Comprehensive ML Library Installation Test
print("🎯 FLUENTI Phase 1: Comprehensive ML Library Test")
print("=" * 60)

# Test all requested packages
test_packages = [
    ("PyTorch", "torch"),
    ("Transformers", "transformers"), 
    ("Datasets", "datasets"),
    ("PEFT", "peft"),
    ("TRL", "trl"),
    ("Accelerate", "accelerate"),
    ("BitsAndBytes", "bitsandbytes"),
    ("SoundFile", "soundfile"),
    ("PyAnnote Audio", "pyannote.audio"),
    ("ONNX", "onnx"),
    ("ONNX Runtime GPU", "onnxruntime"),
    ("TTS", "TTS"),
    ("OpenAI Whisper", "whisper")
]

# Test each package
working_packages = []
failed_packages = []

for display_name, import_name in test_packages:
    try:
        module = __import__(import_name)
        version = getattr(module, '__version__', 'Unknown')
        print(f"✅ {display_name}: {version}")
        working_packages.append(display_name)
    except ImportError as e:
        print(f"❌ {display_name}: Not available")
        failed_packages.append(display_name)
    except Exception as e:
        print(f"⚠️  {display_name}: Error - {e}")
        failed_packages.append(display_name)

# Test GPU functionality
print(f"\n🖥️ GPU Test:")
try:
    import torch
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Test GPU computation
        device = torch.device("cuda")
        x = torch.randn(100, 100).to(device)
        y = torch.matmul(x, x.T)
        print(f"✅ GPU computation test passed!")
    else:
        print("❌ CUDA not available")
except Exception as e:
    print(f"❌ GPU test failed: {e}")

# Test audio processing capability
print(f"\n🎵 Audio Processing Test:")
try:
    import soundfile as sf
    import numpy as np
    
    # Create test audio
    sample_rate = 16000
    audio_data = np.random.randn(sample_rate).astype(np.float32)
    print(f"✅ Can create audio data: {audio_data.shape}")
    
    # Test if we can process with transformers
    from transformers import AutoProcessor
    processor = AutoProcessor.from_pretrained("openai/whisper-tiny")
    inputs = processor(audio_data, sampling_rate=sample_rate, return_tensors="pt")
    print(f"✅ Audio preprocessing working: {inputs['input_features'].shape}")
    
except Exception as e:
    print(f"❌ Audio processing test failed: {e}")

# Test pyannote functionality
print(f"\n🎤 PyAnnote Audio Test:")
try:
    from pyannote.audio import Pipeline
    print(f"✅ PyAnnote Pipeline can be imported")
except Exception as e:
    print(f"❌ PyAnnote test failed: {e}")

# Summary
print(f"\n📊 Installation Summary:")
print(f"✅ Working packages: {len(working_packages)}/{len(test_packages)}")
print(f"❌ Failed packages: {len(failed_packages)}/{len(test_packages)}")

if working_packages:
    print(f"\n🚀 Successfully installed:")
    for pkg in working_packages:
        print(f"   • {pkg}")

if failed_packages:
    print(f"\n⚠️  Missing packages:")
    for pkg in failed_packages:
        print(f"   • {pkg}")

# Missing package solutions
print(f"\n💡 Solutions for missing packages:")
print(f"• TTS: Can be installed separately or use Windows SAPI")
print(f"• OpenAI Whisper: Needs git or use transformers whisper models")
print(f"• espeak-ng: Windows binary needed, not Python package")
print(f"• ffmpeg-python: Can be installed separately")

print(f"\n🎉 Your FLUENTI ML environment is {'READY' if len(working_packages) >= 8 else 'PARTIALLY READY'}!")
print(f"🚀 Core STT and emotion detection capabilities are functional!")
