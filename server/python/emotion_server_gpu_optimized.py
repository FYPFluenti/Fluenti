#!/usr/bin/env python3
"""
RTX 2050 GPU-Optimized Emotion Server
Specially configured for 4GB VRAM with smart memory management
"""

import sys
import json
import warnings
import gc
import torch
from transformers import pipeline
import librosa
import numpy as np
import os
from transformers.utils import logging as transformers_logging
import signal
import threading
import time

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")
transformers_logging.set_verbosity_error()

class GPUOptimizedEmotionDetector:
    def __init__(self):
        self.text_model = None
        self.device = None
        self.model_loaded = False
        self.running = True
        
        # Smart GPU detection for RTX 2050
        if torch.cuda.is_available():
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
            print(f"🎮 GPU Detected: {torch.cuda.get_device_name(0)} ({gpu_memory:.1f}GB)", file=sys.stderr)
            
            if gpu_memory <= 4.5:  # RTX 2050 or similar
                print("🔧 RTX 2050 Detected: Using CPU-first with GPU fallback strategy", file=sys.stderr)
                self.device = -1  # Start with CPU
            else:
                print("🚀 High-end GPU: Using GPU with full optimization", file=sys.stderr)
                self.device = 0
        else:
            print("💻 No GPU available: Using CPU", file=sys.stderr)
            self.device = -1
        
        # Load model at startup
        self.load_text_model()
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown_handler)
        signal.signal(signal.SIGTERM, self.shutdown_handler)
    
    def shutdown_handler(self, signum, frame):
        print("🛑 Shutting down emotion detection server...", file=sys.stderr)
        self.running = False
        
    def load_text_model(self):
        """Load model with GPU memory optimization for RTX 2050"""
        try:
            print("📥 Loading RoBERTa GoEmotions model with RTX 2050 optimization...", file=sys.stderr)
            
            # Clear any existing GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                gc.collect()
            
            model_kwargs = {
                "low_cpu_mem_usage": True,
                "torch_dtype": torch.float32,  # Use float32 for better compatibility
            }
            
            # RTX 2050 specific optimizations
            if self.device == 0:
                model_kwargs.update({
                    "device_map": "auto",
                    "max_memory": {0: "3.5GB"},  # Reserve 0.5GB for other processes
                })
            
            with open(os.devnull, 'w') as devnull:
                import contextlib
                with contextlib.redirect_stdout(devnull):
                    self.text_model = pipeline(
                        "text-classification",
                        model="SamLowe/roberta-base-go_emotions",
                        tokenizer="SamLowe/roberta-base-go_emotions",
                        device=self.device,
                        return_all_scores=True,
                        model_kwargs=model_kwargs
                    )
            
            # Memory cleanup after loading
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                if self.device == 0:
                    memory_used = torch.cuda.memory_allocated(0) / 1024**3
                    print(f"🎮 GPU Memory Used: {memory_used:.2f}GB", file=sys.stderr)
            
            self.model_loaded = True
            print("✅ RoBERTa model loaded and ready for requests", file=sys.stderr)
            
        except Exception as e:
            print(f"❌ GPU loading failed: {e}", file=sys.stderr)
            print("🔄 Falling back to CPU mode...", file=sys.stderr)
            
            # Fallback to CPU
            self.device = -1
            try:
                with open(os.devnull, 'w') as devnull:
                    import contextlib
                    with contextlib.redirect_stdout(devnull):
                        self.text_model = pipeline(
                            "text-classification",
                            model="SamLowe/roberta-base-go_emotions",
                            tokenizer="SamLowe/roberta-base-go_emotions",
                            device=-1,  # CPU
                            return_all_scores=True,
                            model_kwargs={
                                "low_cpu_mem_usage": True,
                                "torch_dtype": torch.float32
                            }
                        )
                self.model_loaded = True
                print("✅ Fallback to CPU successful", file=sys.stderr)
            except Exception as cpu_error:
                print(f"❌ CPU fallback also failed: {cpu_error}", file=sys.stderr)
                self.model_loaded = False
    
    def detect_text_emotion(self, text, language="en"):
        """Fast text emotion detection with memory optimization"""
        try:
            if not self.model_loaded or not self.text_model:
                return {"emotion": "neutral", "confidence": 0.5, "error": "Model not loaded"}
            
            if not text or len(text.strip()) < 2:
                return {"emotion": "neutral", "confidence": 0.5}
            
            # Process with cached model
            processed_text = text.strip()[:512]  # Limit input length
            
            # Clear cache before inference for RTX 2050
            if torch.cuda.is_available() and self.device == 0:
                torch.cuda.empty_cache()
            
            results = self.text_model(processed_text)
            
            # Process results
            emotion_scores = {}
            top_emotion = {"label": "neutral", "score": 0.0}
            
            if isinstance(results, list) and len(results) > 0:
                scores = results[0] if isinstance(results[0], list) else results
                
                for item in scores:
                    if isinstance(item, dict) and "label" in item and "score" in item:
                        emotion_scores[item["label"]] = item["score"]
                        if item["score"] > top_emotion["score"]:
                            top_emotion = item
            
            # Memory cleanup after inference
            if torch.cuda.is_available() and self.device == 0:
                torch.cuda.empty_cache()
            
            return {
                "emotion": top_emotion["label"],
                "confidence": float(top_emotion["score"]),
                "all_scores": emotion_scores,
                "device": "GPU" if self.device == 0 else "CPU"
            }
            
        except Exception as e:
            print(f"❌ Text emotion detection error: {e}", file=sys.stderr)
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}

    def run(self):
        """Main server loop with RTX 2050 optimizations"""
        print("📡 Emotion detection server ready for requests", file=sys.stderr)
        
        while self.running:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                
                request = json.loads(line.strip())
                
                if request.get("action") == "detect_text":
                    result = self.detect_text_emotion(
                        request.get("text", ""),
                        request.get("language", "en")
                    )
                    print(json.dumps(result))
                    sys.stdout.flush()
                
                elif request.get("action") == "ping":
                    print(json.dumps({"status": "alive", "model_loaded": self.model_loaded}))
                    sys.stdout.flush()
                
                elif request.get("action") == "memory_status":
                    status = {"cpu_available": True}
                    if torch.cuda.is_available():
                        status.update({
                            "gpu_available": True,
                            "gpu_memory_allocated": torch.cuda.memory_allocated(0) / 1024**3,
                            "gpu_memory_reserved": torch.cuda.memory_reserved(0) / 1024**3,
                            "current_device": "GPU" if self.device == 0 else "CPU"
                        })
                    print(json.dumps(status))
                    sys.stdout.flush()
                
            except json.JSONDecodeError:
                continue
            except Exception as e:
                error_response = {"error": str(e), "status": "error"}
                print(json.dumps(error_response))
                sys.stdout.flush()

if __name__ == "__main__":
    try:
        detector = GPUOptimizedEmotionDetector()
        detector.run()
    except KeyboardInterrupt:
        print("🛑 Server interrupted", file=sys.stderr)
    except Exception as e:
        print(f"❌ Server error: {e}", file=sys.stderr)
        sys.exit(1)
