import torch
import transformers
print("✅ Core libraries loaded successfully!")

# Test PyTorch and GPU
print(f"📦 PyTorch version: {torch.__version__}")
print(f"📦 Transformers version: {transformers.__version__}")
print(f"🖥️ CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"🎯 GPU: {torch.cuda.get_device_name(0)}")
    print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    
    # Test basic GPU operations
    device = torch.device("cuda")
    x = torch.randn(1000, 1000).to(device)
    y = torch.randn(1000, 1000).to(device)
    z = torch.matmul(x, y)
    print(f"✅ GPU computation test passed! Result shape: {z.shape}")

# Test Transformers library
print("\n🧪 Testing Transformers library...")
try:
    from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
    print("✅ Speech model classes imported successfully!")
    
    # Test emotion detection model (we know this works)
    from transformers import pipeline
    print("✅ Pipeline API imported successfully!")
    
    print("\n🎉 All core ML libraries are working perfectly!")
    print("🚀 Ready for direct Whisper model loading!")
    
except Exception as e:
    print(f"❌ Error testing transformers: {e}")

# Check for other useful packages
optional_packages = ['datasets', 'accelerate', 'soundfile', 'whisper']
print(f"\n📋 Optional package status:")
for package in optional_packages:
    try:
        __import__(package)
        print(f"✅ {package}: Available")
    except ImportError:
        print(f"❌ {package}: Not available")
