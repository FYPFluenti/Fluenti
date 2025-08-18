#!/usr/bin/env python3
"""
Simple Whisper test with correct parameters
"""

import torch
from transformers import pipeline
import numpy as np
import gc

def test_whisper_fixed():
    print("=== TESTING FIXED WHISPER CONFIGURATION ===")
    
    # Check GPU availability
    device = 0 if torch.cuda.is_available() else -1
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    
    print(f"Using device: {'GPU (CUDA)' if device == 0 else 'CPU'}")
    print(f"Using dtype: {torch_dtype}")
    
    try:
        # Create pipeline with correct parameters (no low_cpu_mem_usage)
        pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-tiny",
            device=device,
            torch_dtype=torch_dtype
        )
        
        print("✓ Model loaded successfully")
        
        # Create test audio (1 second of 440Hz tone)
        test_audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 16000)).astype(np.float32)
        
        # Test transcription
        result = pipe(test_audio)
        print(f"✓ Test result: {result}")
        
        # Clean up
        del pipe
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("✓ Memory cleaned up")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_whisper_fixed()
    if success:
        print("\n🎉 WHISPER IS NOW WORKING CORRECTLY!")
    else:
        print("\n❌ Whisper still has issues")
