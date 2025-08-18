#!/usr/bin/env python3
"""
Comprehensive Whisper Model Test and Fix
This script will:
1. Check PyTorch and CUDA availability
2. Test Whisper model loading with different configurations
3. Optimize for GPU usage if available
4. Provide detailed error diagnostics
"""

import os
import sys
import torch
import gc
import traceback
from pathlib import Path

def check_environment():
    """Check Python environment and dependencies"""
    print("=== ENVIRONMENT CHECK ===")
    print(f"Python version: {sys.version}")
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"GPU count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            gpu = torch.cuda.get_device_properties(i)
            print(f"GPU {i}: {gpu.name}, Memory: {gpu.total_memory // 1024**3}GB")
        print(f"Current GPU: {torch.cuda.current_device()}")
    
    # Check available memory
    import psutil
    memory = psutil.virtual_memory()
    print(f"System Memory: {memory.total // 1024**3}GB total, {memory.available // 1024**3}GB available")
    print()

def test_transformers_import():
    """Test transformers library"""
    print("=== TESTING TRANSFORMERS ===")
    try:
        from transformers import pipeline, WhisperProcessor, WhisperForConditionalGeneration
        print("✓ Transformers imported successfully")
        
        # Check cache directory
        from transformers import TRANSFORMERS_CACHE
        print(f"Transformers cache: {TRANSFORMERS_CACHE}")
        
        return True
    except Exception as e:
        print(f"✗ Transformers import failed: {e}")
        return False

def test_whisper_models():
    """Test different Whisper model sizes"""
    print("=== TESTING WHISPER MODELS ===")
    
    # Model sizes to test (from smallest to largest)
    models_to_test = [
        "openai/whisper-tiny",
        "openai/whisper-base", 
        "openai/whisper-small"
    ]
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    successful_models = []
    
    for model_name in models_to_test:
        print(f"\nTesting {model_name}...")
        try:
            # Clear memory before each test
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Try to load model with optimizations
            from transformers import pipeline
            
            # Use specific configurations for better memory management
            pipe = pipeline(
                "automatic-speech-recognition",
                model=model_name,
                device=0 if torch.cuda.is_available() else -1,  # GPU if available
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True,
                use_safetensors=True
            )
            
            print(f"✓ {model_name} loaded successfully")
            successful_models.append((model_name, pipe))
            
            # Test with a dummy input
            import numpy as np
            dummy_audio = np.random.randn(16000).astype(np.float32)  # 1 second of dummy audio
            result = pipe(dummy_audio)
            print(f"✓ Model inference test passed: {result}")
            
            # Clean up
            del pipe
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
        except Exception as e:
            print(f"✗ {model_name} failed: {e}")
            print(f"Error details: {traceback.format_exc()}")
            
            # Clean up on error
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
    
    return successful_models

def test_audio_processing():
    """Test audio file processing"""
    print("\n=== TESTING AUDIO PROCESSING ===")
    
    try:
        # Test with librosa
        import librosa
        print("✓ librosa available")
        
        # Test with soundfile
        import soundfile as sf
        print("✓ soundfile available")
        
        # Create a test audio file
        import numpy as np
        test_audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 16000))  # 1 second 440Hz tone
        
        # Save as WAV
        sf.write("test_audio.wav", test_audio, 16000)
        print("✓ Test audio file created")
        
        # Try to load it back
        audio, sr = librosa.load("test_audio.wav", sr=16000)
        print(f"✓ Audio loaded: {len(audio)} samples at {sr}Hz")
        
        # Clean up
        os.remove("test_audio.wav")
        
        return True
        
    except Exception as e:
        print(f"✗ Audio processing test failed: {e}")
        return False

def optimize_for_gpu():
    """Configure optimal settings for GPU usage"""
    print("\n=== GPU OPTIMIZATION ===")
    
    if not torch.cuda.is_available():
        print("No GPU available, using CPU optimizations")
        # CPU optimizations
        torch.set_num_threads(1)  # Limit CPU threads to save memory
        os.environ['OMP_NUM_THREADS'] = '1'
        return False
    
    print("Configuring for GPU usage...")
    
    # GPU optimizations
    torch.backends.cudnn.benchmark = True  # Optimize for fixed input sizes
    torch.backends.cudnn.deterministic = False  # Allow non-deterministic algorithms for speed
    
    # Set memory fraction if needed
    # torch.cuda.set_per_process_memory_fraction(0.8)  # Use 80% of GPU memory
    
    # Environment variables for memory management
    os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'
    
    print(f"✓ GPU optimization configured")
    return True

def create_optimized_whisper_function():
    """Create an optimized Whisper transcription function"""
    print("\n=== CREATING OPTIMIZED FUNCTION ===")
    
    # Determine best model and device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_name = "openai/whisper-tiny"  # Start with smallest model
    
    try:
        from transformers import pipeline
        
        # Create optimized pipeline
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_name,
            device=0 if torch.cuda.is_available() else -1,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            low_cpu_mem_usage=True,
            use_safetensors=True
        )
        
        print(f"✓ Optimized pipeline created with {model_name} on {device}")
        
        # Test the function
        import numpy as np
        test_audio = np.random.randn(16000).astype(np.float32)
        result = pipe(test_audio)
        print(f"✓ Test transcription: {result}")
        
        return pipe
        
    except Exception as e:
        print(f"✗ Failed to create optimized function: {e}")
        return None

def main():
    """Main test function"""
    print("WHISPER MODEL DIAGNOSTIC AND OPTIMIZATION TOOL")
    print("=" * 50)
    
    # Run all tests
    check_environment()
    
    if not test_transformers_import():
        print("Please install transformers: pip install transformers")
        return
    
    test_audio_processing()
    
    # Optimize for available hardware
    use_gpu = optimize_for_gpu()
    
    # Test models
    successful_models = test_whisper_models()
    
    if successful_models:
        print(f"\n✓ SUCCESS: {len(successful_models)} model(s) working:")
        for model_name, _ in successful_models:
            print(f"  - {model_name}")
    else:
        print("\n✗ NO MODELS WORKING - Check dependencies and memory")
        return
    
    # Create optimized function
    optimized_pipe = create_optimized_whisper_function()
    
    if optimized_pipe:
        print("\n=== RECOMMENDATIONS ===")
        print(f"✓ Use device: {'GPU (CUDA)' if use_gpu else 'CPU'}")
        print(f"✓ Recommended model: openai/whisper-tiny")
        print(f"✓ Use torch_dtype: {'float16' if use_gpu else 'float32'}")
        print("✓ Enable low_cpu_mem_usage=True")
        print("✓ Clean up memory after each use")
        
        # Clean up
        del optimized_pipe
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    main()
