#!/usr/bin/env python3
"""
Edge TTS Generator - Free High-Quality Neural Voices
Uses Microsoft Edge's neural TTS voices for human-like speech
Supports multiple languages and high-quality neural voices
"""

import sys
import json
import base64
import tempfile
import os
import time
import asyncio
from datetime import datetime

try:
    import edge_tts
except ImportError:
    print(json.dumps({
        "error": "edge-tts package not installed. Install with: pip install edge-tts", 
        "audioBase64": None
    }))
    sys.exit(1)

async def generate_edge_tts_audio(text, language="en", voice=None, rate="+0%", pitch="+0Hz"):
    """Generate TTS audio using Microsoft Edge Neural Voices"""
    try:
        start_time = time.time()
        
        # Clean and prepare text
        clean_text = text.strip()
        if len(clean_text) > 1000:
            clean_text = clean_text[:1000] + "..."
        
        # Select appropriate neural voice based on language
        if not voice:
            if language == 'ur':
                voice = "ur-PK-AsadNeural"  # Urdu Pakistan - Male Neural Voice
            else:
                # High quality English neural voices
                voice = "en-US-AriaNeural"  # Female, expressive and natural
                # Other excellent options:
                # "en-US-JennyNeural" - Female, very natural
                # "en-US-GuyNeural" - Male, natural
                # "en-US-DavisNeural" - Male, warm and friendly
        
        # Create unique temp file
        timestamp = int(time.time() * 1000)
        audio_path = os.path.join(tempfile.gettempdir(), f"edge_tts_{timestamp}.wav")
        
        # Create TTS communication
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch)
        
        # Generate and save audio
        await communicate.save(audio_path)
        
        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Cleanup
            try:
                os.remove(audio_path)
            except:
                pass
            
            processing_time = time.time() - start_time
            
            return {
                "audioBase64": audio_base64,
                "text": text,
                "language": language,
                "voice": voice,
                "processing_time": processing_time,
                "model": "edge_tts_neural",
                "quality": "high",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise Exception("Audio file was not generated or is empty")
            
    except Exception as e:
        return {
            "error": f"Edge TTS generation failed: {str(e)}",
            "audioBase64": None,
            "text": text,
            "language": language,
            "voice": voice or "unknown"
        }

async def main():
    """Main async function for subprocess calls"""
    try:
        # Read request from stdin
        request_line = sys.stdin.readline().strip()
        if not request_line:
            print(json.dumps({"error": "No input provided", "audioBase64": None}))
            return
        
        request_data = json.loads(request_line)
        text = request_data.get("text", "")
        language = request_data.get("language", "en")
        voice = request_data.get("voice", None)
        rate = request_data.get("rate", "+0%")
        pitch = request_data.get("pitch", "+0Hz")
        
        if not text.strip():
            print(json.dumps({"error": "Empty text provided", "audioBase64": None}))
            return
        
        # Generate TTS
        result = await generate_edge_tts_audio(text, language, voice, rate, pitch)
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": f"Invalid JSON input: {str(e)}", 
            "audioBase64": None
        }))
    except Exception as e:
        print(json.dumps({
            "error": f"Edge TTS error: {str(e)}", 
            "audioBase64": None
        }))

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())