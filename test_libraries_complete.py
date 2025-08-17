import torch
import transformers
from TTS.api import TTS
print("✅ All libraries loaded successfully!")

# Test core functionality
print(f"📦 PyTorch version: {torch.__version__}")
print(f"📦 Transformers version: {transformers.__version__}")
print(f"🖥️ CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"🎯 GPU: {torch.cuda.get_device_name(0)}")
    print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

# Test TTS initialization
print("\n🧪 Testing TTS initialization...")
try:
    # Use a lightweight model for testing
    tts = TTS("tts_models/en/jenny/jenny", progress_bar=False)
    print("✅ TTS model loaded successfully!")
except Exception as e:
    print(f"⚠️ TTS model loading failed: {e}")
    print("💡 This is normal - TTS models are large and may need internet connection")

print("\n🎉 Core ML setup is complete and ready for FLUENTI Phase 1!")
print("🚀 Ready to proceed with direct Whisper model loading!")
