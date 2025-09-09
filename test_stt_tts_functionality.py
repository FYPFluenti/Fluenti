#!/usr/bin/env python3
"""
Simple test script to verify STT and TTS functionality
"""

import sys
import json
import base64
import tempfile
import os

def test_stt():
    """Test Speech-to-Text functionality"""
    print("🎙️ Testing STT (Speech-to-Text)...")
    
    try:
        from transformers import pipeline
        import torch
        
        # Force CPU usage
        device = -1
        torch_dtype = torch.float32
        
        # Create a small pipeline test
        pipe = pipeline(
            "automatic-speech-recognition", 
            model="openai/whisper-tiny",
            device=device,
            torch_dtype=torch_dtype
        )
        
        print("✅ STT: Whisper model loaded successfully")
        del pipe
        return True
        
    except Exception as e:
        print(f"❌ STT Error: {e}")
        return False

def test_tts():
    """Test Text-to-Speech functionality"""
    print("\n🔊 Testing TTS (Text-to-Speech)...")
    
    try:
        import subprocess
        import tempfile
        
        # Test text
        test_text = "Hello, this is a test message."
        
        # Create temp files
        timestamp = int(1000000)  # Static for testing
        audio_path = os.path.join(tempfile.gettempdir(), f"test_tts_{timestamp}.wav")
        script_path = os.path.join(tempfile.gettempdir(), f"test_script_{timestamp}.ps1")
        
        # PowerShell script
        powershell_script = f'''
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 2
$synth.SetOutputToWaveFile("{audio_path}")
$synth.Speak("{test_text}")
$synth.Dispose()
'''
        
        # Write script
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(powershell_script)
        
        # Execute
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", script_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check if audio file was created
        if result.returncode == 0 and os.path.exists(audio_path):
            file_size = os.path.getsize(audio_path)
            print(f"✅ TTS: Audio file generated successfully ({file_size} bytes)")
            
            # Cleanup
            try:
                os.remove(script_path)
                os.remove(audio_path)
            except:
                pass
            
            return True
        else:
            print(f"❌ TTS Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        return False

def main():
    print("🧪 Fluenti STT & TTS Functionality Test")
    print("=" * 50)
    
    stt_working = test_stt()
    tts_working = test_tts()
    
    print("\n📊 Test Results:")
    print("=" * 20)
    print(f"STT (Speech-to-Text): {'✅ WORKING' if stt_working else '❌ FAILED'}")
    print(f"TTS (Text-to-Speech): {'✅ WORKING' if tts_working else '❌ FAILED'}")
    
    if stt_working and tts_working:
        print("\n🎉 All systems operational!")
        return 0
    else:
        print("\n⚠️  Some systems need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())
