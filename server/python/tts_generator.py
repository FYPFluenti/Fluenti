#!/usr/bin/env python3
"""
Phase 4 TTS Generator - Windows SAPI Implementation
Generates speech audio from text using Windows Speech API
Optimized for real-time therapeutic responses
"""

import sys
import json
import base64
import tempfile
import os
import time
import subprocess
from datetime import datetime

def generate_tts_audio(text, language="en"):
    """Generate TTS audio using Windows SAPI - Ultra Fast"""
    try:
        start_time = time.time()
        
        # Clean and prepare text
        clean_text = text.replace('"', '""').replace("'", "''")
        if len(clean_text) > 300:
            clean_text = clean_text[:300] + "..."
        
        # Create unique temp files
        timestamp = int(time.time() * 1000)
        audio_path = os.path.join(tempfile.gettempdir(), f"phase4_tts_{timestamp}.wav")
        script_path = os.path.join(tempfile.gettempdir(), f"phase4_script_{timestamp}.ps1")
        
        # Create PowerShell script for Windows TTS
        powershell_script = f'''
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 2
$synth.SetOutputToWaveFile("{audio_path}")
$synth.Speak("{clean_text}")
$synth.Dispose()
'''
        
        # Write and execute script
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(powershell_script)
        
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", script_path],
            capture_output=True,
            text=True,
            timeout=15  # 15 second timeout
        )
        
        if result.returncode == 0 and os.path.exists(audio_path):
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Cleanup
            try:
                os.remove(script_path)
                os.remove(audio_path)
            except:
                pass
            
            processing_time = time.time() - start_time
            
            return {
                "audioBase64": audio_base64,
                "text": text,
                "language": language,
                "processing_time": processing_time,
                "model": "windows_sapi_fast",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise Exception(f"PowerShell TTS failed: {result.stderr}")
            
    except Exception as e:
        return {
            "error": f"TTS generation failed: {str(e)}",
            "audioBase64": None,
            "text": text,
            "language": language
        }

def main():
    """Main function for subprocess calls"""
    try:
        # Read request from stdin
        request_line = sys.stdin.readline().strip()
        if not request_line:
            print(json.dumps({"error": "No input provided", "audioBase64": None}))
            return
        
        request_data = json.loads(request_line)
        text = request_data.get("text", "")
        language = request_data.get("language", "en")
        
        if not text:
            print(json.dumps({"error": "No text provided", "audioBase64": None}))
            return
        
        # Generate TTS audio
        result = generate_tts_audio(text, language)
        
        # Output clean JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "audioBase64": None
        }))

if __name__ == "__main__":
    main()
