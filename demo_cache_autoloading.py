# Demonstrate HF_HOME Cache Auto-Loading
import os
from dotenv import load_dotenv

print("🚀 FLUENTI Model Cache Auto-Loading Demo")
print("=" * 50)

# Load environment variables
load_dotenv()

# Verify cache configuration
hf_home = os.getenv('HF_HOME')
whisper_cache = os.getenv('WHISPER_CACHE_DIR')

print(f"🔧 Configuration:")
print(f"   HF_HOME: {hf_home}")
print(f"   WHISPER_CACHE_DIR: {whisper_cache}")
print()

# Test 1: HuggingFace Transformers Model Download
print("📦 Test 1: HuggingFace Model Auto-Loading")
try:
    from transformers import pipeline
    
    print("Loading sentiment analysis model (will cache on first download)...")
    # This will download to E:\Fluenti\models\hf_cache\hub
    classifier = pipeline("sentiment-analysis", 
                         model="cardiffnlp/twitter-roberta-base-sentiment-latest")
    
    # Test the model
    result = classifier("I love using FLUENTI for emotional therapy!")
    print(f"✅ Model loaded successfully!")
    print(f"   Test result: {result[0]['label']} (confidence: {result[0]['score']:.3f})")
    
    # Check cache contents
    cache_size = sum(os.path.getsize(os.path.join(dirpath, filename))
                    for dirpath, dirnames, filenames in os.walk(hf_home)
                    for filename in filenames)
    print(f"📂 Cache size: {cache_size / (1024*1024):.1f} MB")
    
except Exception as e:
    print(f"⚠️  Model loading error: {e}")

print()

# Test 2: OpenAI Whisper Model Download  
print("🎤 Test 2: OpenAI Whisper Model Auto-Loading")
try:
    import whisper
    
    print("Loading Whisper 'tiny' model (will cache on first download)...")
    # This will use the WHISPER_CACHE_DIR
    model = whisper.load_model("tiny")
    
    print(f"✅ Whisper model loaded successfully!")
    print(f"   Model type: {type(model).__name__}")
    print(f"   Model device: {model.device}")
    
    # Check whisper cache
    if os.path.exists(whisper_cache):
        whisper_files = os.listdir(whisper_cache)
        print(f"📂 Whisper cache files: {len(whisper_files)} files")
        for file in whisper_files:
            if file.endswith('.pt'):
                size = os.path.getsize(os.path.join(whisper_cache, file)) / (1024*1024)
                print(f"   • {file}: {size:.1f} MB")
    
except Exception as e:
    print(f"⚠️  Whisper loading error: {e}")

print()
print("🎯 CACHE BENEFITS:")
print("✅ Models download once, reuse instantly")
print("✅ No repeated downloads - faster startup")
print("✅ Organized model storage in project folder")
print("✅ Easy to backup/share models with project")
print("✅ Reduced internet bandwidth usage")

print(f"\n📁 Your models are cached in: {hf_home}")
print("🚀 FLUENTI is ready for instant model loading!")
