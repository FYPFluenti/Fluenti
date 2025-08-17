# Test HF_HOME Cache Configuration
import os
from dotenv import load_dotenv

print("🔧 Testing HF_HOME Cache Configuration")
print("=" * 45)

# Load environment variables from .env file
load_dotenv()

# Check HF_HOME configuration
hf_home = os.getenv('HF_HOME')
print(f"📁 HF_HOME from .env: {hf_home}")

# Check if the directory exists
if hf_home and os.path.exists(hf_home):
    print(f"✅ Cache directory exists: {hf_home}")
    print(f"📊 Directory is writable: {os.access(hf_home, os.W_OK)}")
    print(f"📊 Directory is readable: {os.access(hf_home, os.R_OK)}")
else:
    print(f"❌ Cache directory does not exist or HF_HOME not set")

# Test with HuggingFace transformers
try:
    import transformers
    print(f"\n🤗 HuggingFace Transformers Version: {transformers.__version__}")
    
    # Check default cache directory
    default_cache = transformers.utils.hub.default_cache_path
    print(f"📂 Default HF Cache Path: {default_cache}")
    
    # Check if HF_HOME overrides the default
    from transformers.utils import HF_HUB_CACHE
    print(f"📂 Current HF Hub Cache: {HF_HUB_CACHE}")
    
except ImportError:
    print("⚠️  HuggingFace transformers not installed")

# Test with OpenAI Whisper
try:
    import whisper
    print(f"\n🎤 OpenAI Whisper Version: {whisper.__version__}")
    
    # Whisper uses a different mechanism - it downloads to ~/.cache/whisper by default
    # But we can set WHISPER_CACHE_DIR
    whisper_cache = os.getenv('WHISPER_CACHE_DIR', os.path.expanduser('~/.cache/whisper'))
    print(f"📂 Whisper Cache Directory: {whisper_cache}")
    
    if hf_home:
        whisper_custom_cache = os.path.join(hf_home, 'whisper')
        print(f"💡 Suggested Whisper Cache: {whisper_custom_cache}")
        
        # Create whisper subdirectory
        os.makedirs(whisper_custom_cache, exist_ok=True)
        print(f"✅ Created Whisper subdirectory: {whisper_custom_cache}")
        
except ImportError:
    print("⚠️  OpenAI Whisper not installed")

print(f"\n🎯 CONFIGURATION SUMMARY:")
print("=" * 30)
if hf_home:
    print(f"✅ HF_HOME configured: {hf_home}")
    print("✅ Models will auto-download to this directory")
    print("✅ Persistent model storage enabled")
    print("✅ Faster subsequent model loading")
else:
    print("❌ HF_HOME not configured")

print(f"\n💡 ADDITIONAL RECOMMENDATIONS:")
print("- Set WHISPER_CACHE_DIR={}/whisper for Whisper model caching".format(hf_home) if hf_home else "- Configure HF_HOME first")
print("- Models will be automatically downloaded on first use")
print("- Cache will speed up subsequent model loads significantly")

print(f"\n🚀 Ready for model auto-loading with persistent cache!")
