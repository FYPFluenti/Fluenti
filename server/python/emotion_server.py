#!/usr/bin/env python3
"""
Phase 3: PERSISTENT Emotion Detection Server
High-performance emotion detection service that keeps models loaded in memory
- Text: roberta-base-go_emotions (27 emotions including stress/anxiety)
- Voice: Fast spectral analysis for performance  
- Server: Persistent process with JSON API over stdin/stdout
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

class PersistentEmotionDetector:
    def __init__(self):
        self.text_model = None
        self.device = 0 if torch.cuda.is_available() else -1
        self.model_loaded = False
        self.running = True
        
        print(f"🚀 Persistent Emotion Server - Using device: {'GPU' if self.device == 0 else 'CPU'}", file=sys.stderr)
        
        # Load model at startup
        self.load_text_model()
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown_handler)
        signal.signal(signal.SIGTERM, self.shutdown_handler)
    
    def shutdown_handler(self, signum, frame):
        print("🛑 Shutting down emotion detection server...", file=sys.stderr)
        self.running = False
        
    def load_text_model(self):
        """Load and cache the RoBERTa model once at startup"""
        try:
            print("📥 Loading RoBERTa GoEmotions model (one-time setup)...", file=sys.stderr)
            
            with open(os.devnull, 'w') as devnull:
                import contextlib
                with contextlib.redirect_stdout(devnull):
                    self.text_model = pipeline(
                        "text-classification",
                        model="SamLowe/roberta-base-go_emotions",
                        tokenizer="SamLowe/roberta-base-go_emotions",
                        device=self.device,
                        return_all_scores=True,
                        model_kwargs={
                            "torch_dtype": torch.float16 if self.device == 0 else torch.float32,
                            "low_cpu_mem_usage": True
                        }
                    )
            
            self.model_loaded = True
            print("✅ RoBERTa model loaded and ready for requests", file=sys.stderr)
            
        except Exception as e:
            print(f"❌ Error loading text model: {e}", file=sys.stderr)
            self.model_loaded = False
    
    def detect_text_emotion(self, text, language="en"):
        """Fast text emotion detection using cached model"""
        try:
            if not self.model_loaded or not self.text_model:
                return {"emotion": "neutral", "confidence": 0.5, "error": "Model not loaded"}
            
            if not text or len(text.strip()) < 2:
                return {"emotion": "neutral", "confidence": 0.5}
            
            # Process with cached model (very fast)
            processed_text = text.strip()[:512]
            results = self.text_model(processed_text)
            
            # Fast processing
            emotion_scores = {}
            top_emotion = {"label": "neutral", "score": 0.0}
            
            if isinstance(results, list) and len(results) > 0:
                scores = results[0] if isinstance(results[0], list) else results
                
                for item in scores:
                    if isinstance(item, dict) and "label" in item and "score" in item:
                        emotion_scores[item["label"]] = item["score"]
                        if item["score"] > top_emotion["score"]:
                            top_emotion = item
            
            # Use raw emotion labels directly for better accuracy
            detected_emotion = top_emotion["label"]
            
            # Only do minimal mapping for technical labels
            if detected_emotion in ["neutral", "realization"]:
                detected_emotion = "neutral"
            
            return {
                "emotion": detected_emotion,  # Use raw label directly
                "confidence": float(top_emotion["score"]),
                "all_scores": emotion_scores,
                "raw_label": top_emotion["label"],
                "method": "persistent_model_raw"
            }
            
        except Exception as e:
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
    
    def detect_text_emotion_with_context(self, text, language="en"):
        """Text emotion detection with context extraction using spaCy"""
        try:
            # First get emotion detection
            emotion_result = self.detect_text_emotion(text, language)
            
            # Add context extraction
            try:
                import spacy
                nlp = spacy.load("en_core_web_sm")
                doc = nlp(text)
                
                # Extract entities and important words
                entities = [ent.text for ent in doc.ents]
                important_words = [token.lemma_ for token in doc 
                                 if token.pos_ in ['NOUN', 'VERB', 'ADJ'] 
                                 and not token.is_stop 
                                 and len(token.text) > 2]
                
                # Combine and deduplicate context
                context = list(set(entities + important_words))
                
                # Add context to result
                emotion_result["context"] = context
                
            except Exception as context_error:
                print(f"Context extraction failed: {context_error}", file=sys.stderr)
                # Fallback: simple word extraction
                words = text.split()
                context = [word for word in words if len(word) > 3][:5]
                emotion_result["context"] = context
            
            return emotion_result
            
        except Exception as e:
            return {"emotion": "neutral", "confidence": 0.5, "context": [], "error": str(e)}
    
    def detect_voice_emotion(self, audio_path):
        """Fast voice emotion detection using spectral analysis"""
        try:
            if not os.path.exists(audio_path):
                return {"emotion": "neutral", "confidence": 0.5, "error": "Audio file not found"}
            
            # Fast spectral analysis
            y, sr = librosa.load(audio_path, duration=10.0, sr=16000)
            
            if len(y) == 0:
                return {"emotion": "neutral", "confidence": 0.5}
            
            # Quick feature extraction
            rms = np.sqrt(np.mean(y**2))
            zcr = float(np.mean(np.abs(np.diff(np.sign(y)))))
            
            # Simple emotion detection
            emotion = "neutral"
            confidence = 0.6
            
            if rms > 0.1:
                emotion = "anger" if zcr > 0.8 else "joy"
                confidence = 0.7
            elif rms < 0.05:
                emotion = "sadness"
                confidence = 0.65
            elif zcr > 1.0:
                emotion = "fear"
                confidence = 0.6
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "features": {"energy": float(rms), "zcr": zcr},
                "method": "fast_spectral"
            }
            
        except Exception as e:
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
    
    def process_request(self, request):
        """Process emotion detection request"""
        try:
            mode = request.get("mode", "text")
            
            if mode == "text":
                text = request.get("text", "")
                language = request.get("language", "en")
                return self.detect_text_emotion(text, language)
                
            elif mode == "text_with_context":
                text = request.get("text", "")
                language = request.get("language", "en")
                return self.detect_text_emotion_with_context(text, language)
                
            elif mode == "voice":
                audio_path = request.get("audio_path", "")
                return self.detect_voice_emotion(audio_path)
                
            elif mode == "combined":
                text = request.get("text", "")
                audio_path = request.get("audio_path", "")
                language = request.get("language", "en")
                
                text_result = self.detect_text_emotion(text, language)
                voice_result = self.detect_voice_emotion(audio_path)
                
                # Fast combination
                if text_result["emotion"] == voice_result["emotion"]:
                    combined_confidence = min(0.95, 
                        (text_result["confidence"] * 0.7 + voice_result["confidence"] * 0.3) * 1.15)
                    emotion = text_result["emotion"]
                else:
                    if text_result["confidence"] * 0.7 >= voice_result["confidence"] * 0.3:
                        emotion = text_result["emotion"]
                        combined_confidence = text_result["confidence"] * 0.7
                    else:
                        emotion = voice_result["emotion"]
                        combined_confidence = voice_result["confidence"] * 0.3
                
                return {
                    "combined": {
                        "emotion": emotion,
                        "confidence": combined_confidence,
                        "text_emotion": text_result["emotion"],
                        "voice_emotion": voice_result["emotion"],
                        "method": "persistent_combined"
                    },
                    "text": text_result,
                    "voice": voice_result
                }
            
            return {"emotion": "neutral", "confidence": 0.5, "error": "Unknown mode"}
            
        except Exception as e:
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
    
    def run_server(self):
        """Main server loop - reads JSON requests from stdin"""
        print("📡 Emotion detection server ready for requests", file=sys.stderr)
        
        while self.running:
            try:
                # Read request from stdin
                line = sys.stdin.readline()
                if not line:
                    break
                    
                line = line.strip()
                if not line:
                    continue
                
                # Parse JSON request
                try:
                    request = json.loads(line)
                except json.JSONDecodeError:
                    error_response = {"emotion": "neutral", "confidence": 0.5, "error": "Invalid JSON"}
                    print(json.dumps(error_response))
                    sys.stdout.flush()
                    continue
                
                # Process request
                result = self.process_request(request)
                
                # Send response
                print(json.dumps(result))
                sys.stdout.flush()
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                error_response = {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
                print(json.dumps(error_response))
                sys.stdout.flush()
        
        print("🛑 Emotion detection server stopped", file=sys.stderr)

def main():
    """Start the persistent emotion detection server"""
    try:
        detector = PersistentEmotionDetector()
        detector.run_server()
    except Exception as e:
        print(f"❌ Server error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
