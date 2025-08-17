# Quick test of WHISPER_CACHE_DIR configuration
import os
from dotenv import load_dotenv

load_dotenv()

whisper_cache = os.getenv('WHISPER_CACHE_DIR')
print(f"WHISPER_CACHE_DIR from .env: {whisper_cache}")

if whisper_cache and os.path.exists(whisper_cache):
    print(f"✅ Whisper cache directory exists and is ready!")
else:
    print(f"⚠️ Whisper cache directory issue")
