#!/usr/bin/env python3
"""
Phase 3: OPTIMIZED Emotion Detection
Text + Voice Emotion Recognition using open-source models
- Text: roberta-base-go_emotions (27 emotions including stress/anxiety)  
- Voice: Lightweight spectral analysis for speed
- Performance: Model caching & fast initialization
Bilingual-ready (English first, Urdu extension)
"""

import sys
import json
import warnings
import gc
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import librosa
import numpy as np
import tempfile
import os
from transformers.utils import logging as transformers_logging

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")
# Suppress transformers info/debug logs to prevent stdout pollution
transformers_logging.set_verbosity_error()

# Global model cache to avoid reloading
_TEXT_MODEL_CACHE = None
_DEVICE_CACHE = None

class EmotionDetector:
    def __init__(self):
        global _DEVICE_CACHE
        self.text_model = None
        self.voice_model = "fast_spectral"  # Use fast spectral analysis by default
        
        # FORCE CPU for emotion detection (training compatibility)
        _DEVICE_CACHE = -1  # Force CPU
        print("[DEBUG] Using CPU (forced for training compatibility)", file=sys.stderr)
        if torch.cuda.is_available():
            print(f"[DEBUG] GPU available ({torch.cuda.get_device_name(0)}) but using CPU", file=sys.stderr)
            
        self.device = _DEVICE_CACHE
        
        print(f"Phase 3 OPTIMIZED Emotion Detection - Using device: CPU", file=sys.stderr)
    
    def load_text_model(self):
        """Load RoBERTa GoEmotions model for text emotion detection - OPTIMIZED"""
        global _TEXT_MODEL_CACHE
        
        if self.text_model is None:
            # Check if we have a cached model
            if _TEXT_MODEL_CACHE is not None:
                print("[DEBUG] Using cached RoBERTa model", file=sys.stderr)
                self.text_model = _TEXT_MODEL_CACHE
                return
            
            try:
                print("[DEBUG] Loading RoBERTa GoEmotions model (first time)...", file=sys.stderr)
                # Use optimized settings for faster loading
                import os
                import contextlib
                
                with open(os.devnull, 'w') as devnull:
                    with contextlib.redirect_stdout(devnull):
                        # Optimized pipeline settings
                        self.text_model = pipeline(
                            "text-classification",
                            model="SamLowe/roberta-base-go_emotions",
                            tokenizer="SamLowe/roberta-base-go_emotions",
                            device=self.device,
                            return_all_scores=True,
                            # Performance optimizations
                            model_kwargs={
                                "torch_dtype": torch.float16 if self.device == 0 else torch.float32,
                                "low_cpu_mem_usage": True,
                                "use_cache": True
                            }
                        )
                        
                # Cache the model globally for subsequent uses
                _TEXT_MODEL_CACHE = self.text_model
                print("[DEBUG] ✅ Text emotion model loaded and cached", file=sys.stderr)
            except Exception as e:
                print(f"[DEBUG] ❌ Error loading text model: {e}", file=sys.stderr)
                raise e
    
    def load_voice_model(self):
        """OPTIMIZED: Use fast spectral analysis instead of heavy models"""
        if self.voice_model is None or self.voice_model == "fast_spectral":
            print("[DEBUG] Using fast spectral analysis for voice emotion (optimized)", file=sys.stderr)
            self.voice_model = "fast_spectral"
            return
            
        # Legacy heavy model loading (disabled for performance)
        print("[DEBUG] Voice model loading skipped for performance - using spectral analysis", file=sys.stderr)
        self.voice_model = "fast_spectral"
    
    def detect_text_emotion(self, text, language="en"):
        """
        OPTIMIZED: Detect emotion from text using RoBERTa GoEmotions
        Returns: {emotion: str, confidence: float, all_scores: dict}
        """
        try:
            # Fast validation
            if not text or len(text.strip()) < 2:
                return {"emotion": "neutral", "confidence": 0.5, "all_scores": {}}
            
            # Load model (uses cache if available)
            self.load_text_model()
            
            if self.text_model is None:
                return {"emotion": "neutral", "confidence": 0.5, "all_scores": {}, "error": "Model not loaded"}
            
            print(f"Analyzing text emotion: {text[:50]}...", file=sys.stderr)
            
            # Optimized text preprocessing
            processed_text = text.strip()[:512]  # Limit length for speed
            
            # Get emotion scores with timeout protection
            try:
                results = self.text_model(processed_text)
            except Exception as model_error:
                print(f"Model inference error: {model_error}", file=sys.stderr)
                return {"emotion": "neutral", "confidence": 0.5, "error": str(model_error)}
            
            # Fast processing of results
            emotion_scores = {}
            top_emotion = {"label": "neutral", "score": 0.0}
            
            if isinstance(results, list) and len(results) > 0:
                scores = results[0] if isinstance(results[0], list) else results
                
                # Vectorized processing for speed
                for item in scores:
                    if isinstance(item, dict) and "label" in item and "score" in item:
                        emotion_scores[item["label"]] = item["score"]
                        if item["score"] > top_emotion["score"]:
                            top_emotion = item
            
            # Fast emotion mapping (reduced set for performance)
            emotion_mapping = {
                "anger": "anger", "fear": "fear", "joy": "joy", "sadness": "sadness",
                "surprise": "surprise", "disgust": "disgust", "neutral": "neutral",
                "nervousness": "stress", "disappointment": "sadness", "excitement": "joy",
                "annoyance": "anger", "caring": "joy", "approval": "joy"
            }
            
            detected_emotion = emotion_mapping.get(top_emotion["label"], "neutral")
            
            # Fast stress detection
            if any(keyword in text.lower() for keyword in ["stress", "anxiety", "overwhelm"]):
                if detected_emotion in ["fear", "sadness"]:
                    detected_emotion = "stress"
            
            result = {
                "emotion": detected_emotion,
                "confidence": float(top_emotion["score"]),
                "all_scores": emotion_scores,
                "raw_label": top_emotion["label"]
            }
            
            print(f"✅ Text emotion detected: {result['emotion']} ({result['confidence']:.3f})", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"❌ Text emotion detection error: {e}", file=sys.stderr)
            return {"emotion": "neutral", "confidence": 0.5, "all_scores": {}, "error": str(e)}
    
    def detect_voice_emotion(self, audio_path):
        """
        OPTIMIZED: Fast voice emotion detection using spectral analysis
        Returns: {emotion: str, confidence: float, features: dict}
        """
        try:
            # Always use fast spectral analysis for performance
            self.load_voice_model()
            
            if not os.path.exists(audio_path):
                return {"emotion": "neutral", "confidence": 0.5, "error": "Audio file not found"}
            
            print(f"Fast voice emotion analysis: {audio_path}", file=sys.stderr)
            return self._spectral_emotion_analysis(audio_path)
            
        except Exception as e:
            print(f"❌ Voice emotion detection error: {e}", file=sys.stderr)
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
    
    def _spectral_emotion_analysis(self, audio_path):
        """
        OPTIMIZED: Fast spectral analysis for voice emotion detection
        Analyzes pitch, energy, and spectral features with performance optimizations
        """
        try:
            # Fast audio loading with limitations for speed
            y, sr = librosa.load(audio_path, duration=10.0, sr=16000)  # Limit duration and sample rate
            
            if len(y) == 0:
                return {"emotion": "neutral", "confidence": 0.5, "error": "Empty audio"}
            
            # Fast feature extraction (vectorized operations)
            features = {}
            
            # Quick energy analysis (RMS)
            rms = np.sqrt(np.mean(y**2))
            features["energy"] = float(rms)
            
            # Fast pitch estimation (simplified)
            autocorr = np.correlate(y, y, mode='full')
            autocorr = autocorr[len(autocorr)//2:]
            
            # Find pitch (simplified method for speed)
            pitch_estimate = 0
            if len(autocorr) > 50:
                pitch_estimate = np.argmax(autocorr[20:200]) + 20  # Rough pitch detection
                pitch_estimate = sr / pitch_estimate if pitch_estimate > 0 else 0
            
            features["pitch"] = float(pitch_estimate)
            
            # Fast spectral analysis 
            fft = np.abs(np.fft.fft(y))
            spectral_centroid = float(np.mean(np.where(fft > 0.01)[0])) * sr / len(fft) if np.any(fft > 0.01) else 1000
            features["spectral_centroid"] = spectral_centroid
            
            # Zero crossing rate (fast)
            zcr = float(np.mean(np.abs(np.diff(np.sign(y)))))
            features["zcr"] = zcr
            
            # OPTIMIZED emotion detection rules (simplified for speed)
            emotion = "neutral"
            confidence = 0.6
            
            # High energy emotions
            if features["energy"] > 0.1:
                if features["pitch"] > 200:
                    emotion = "joy" if features["zcr"] < 0.8 else "anger"
                    confidence = 0.7
                else:
                    emotion = "anger"
                    confidence = 0.65
            
            # Low energy emotions  
            elif features["energy"] < 0.05:
                emotion = "sadness"
                confidence = 0.65
            
            # High variability = stress/fear
            elif features["zcr"] > 1.0:
                emotion = "fear"
                confidence = 0.6
            
            result = {
                "emotion": emotion,
                "confidence": confidence,
                "features": features,
                "method": "fast_spectral"
            }
            
            print(f"✅ Fast voice emotion: {emotion} ({confidence:.3f})", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"❌ Fast spectral analysis error: {e}", file=sys.stderr)
            return {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
    
    def combine_emotions(self, text_result, voice_result, text_weight=0.7, voice_weight=0.3):
        """
        OPTIMIZED: Fast combination of text and voice emotion detection results
        Text-favored weighting for better accuracy and speed
        """
        try:
            # Fast confidence-based weight adjustment
            text_conf = text_result.get("confidence", 0.5)
            voice_conf = voice_result.get("confidence", 0.5)
            
            # Simplified weight calculation for speed
            if text_conf < 0.4:
                text_weight, voice_weight = 0.3, 0.7
            elif voice_conf < 0.4:
                text_weight, voice_weight = 0.9, 0.1
            
            # Fast emotion matching check
            text_emotion = text_result.get("emotion", "neutral")
            voice_emotion = voice_result.get("emotion", "neutral")
            
            if text_emotion == voice_emotion:
                # Emotions match - boost confidence
                combined_confidence = min(0.95, (text_conf * text_weight + voice_conf * voice_weight) * 1.15)
                emotion = text_emotion
            else:
                # Different emotions - use weighted decision (fast)
                text_score = text_conf * text_weight
                voice_score = voice_conf * voice_weight
                
                if text_score >= voice_score:
                    emotion = text_emotion
                    combined_confidence = text_score
                else:
                    emotion = voice_emotion  
                    combined_confidence = voice_score
            
            result = {
                "emotion": emotion,
                "confidence": float(combined_confidence),
                "text_emotion": text_emotion,
                "voice_emotion": voice_emotion,
                "text_confidence": text_conf,
                "voice_confidence": voice_conf,
                "weights": {"text": text_weight, "voice": voice_weight},
                "method": "fast_combined"
            }
            
            print(f"✅ Fast combined emotion: {emotion} ({combined_confidence:.3f})", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"❌ Fast emotion combination error: {e}", file=sys.stderr)
            return {
                "emotion": text_result.get("emotion", "neutral"),
                "confidence": text_result.get("confidence", 0.5),
                "error": str(e)
            }

def main():
    """Main function for subprocess calls"""
    try:
        if len(sys.argv) < 2:
            print("Usage: python emotion_detector.py <mode> [args...]")
            print("Modes: text, voice, combined")
            sys.exit(1)
        
        mode = sys.argv[1]
        detector = EmotionDetector()
        
        if mode == "text":
            # Text emotion detection
            if len(sys.argv) < 3:
                print("Usage: python emotion_detector.py text <text> [language]")
                sys.exit(1)
            
            text = sys.argv[2]
            language = sys.argv[3] if len(sys.argv) > 3 else "en"
            
            result = detector.detect_text_emotion(text, language)
            print(json.dumps(result))
        
        elif mode == "voice":
            # Voice emotion detection
            if len(sys.argv) < 3:
                print("Usage: python emotion_detector.py voice <audio_path>")
                sys.exit(1)
            
            audio_path = sys.argv[2]
            result = detector.detect_voice_emotion(audio_path)
            print(json.dumps(result))
        
        elif mode == "combined":
            # Combined text + voice emotion detection
            if len(sys.argv) < 4:
                print("Usage: python emotion_detector.py combined <text> <audio_path> [language]")
                sys.exit(1)
            
            text = sys.argv[2]
            audio_path = sys.argv[3]
            language = sys.argv[4] if len(sys.argv) > 4 else "en"
            
            text_result = detector.detect_text_emotion(text, language)
            voice_result = detector.detect_voice_emotion(audio_path)
            combined_result = detector.combine_emotions(text_result, voice_result)
            
            # Return comprehensive results
            output = {
                "combined": combined_result,
                "text": text_result,
                "voice": voice_result
            }
            print(json.dumps(output))
        
        else:
            print(f"Unknown mode: {mode}")
            sys.exit(1)
        
        # Optimized cleanup - keep model cached for subsequent calls
        # Only clear if explicitly requested
        if os.environ.get("EMOTION_CLEAR_CACHE", "false").lower() == "true":
            if hasattr(detector, 'text_model') and detector.text_model:
                del detector.text_model
            if hasattr(detector, 'voice_model') and detector.voice_model:
                del detector.voice_model
            gc.collect()
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
        
    except Exception as e:
        error_result = {"emotion": "neutral", "confidence": 0.5, "error": str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
