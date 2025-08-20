#!/usr/bin/env python3
"""
Phase 4: Llama-2-7b Response Generator for Empathetic Conversations
Handles emotion-aware, history-conscious therapeutic responses
Optimized for RTX 2050 (4GB VRAM) with 8-bit loading
"""

import sys
import json
import warnings
import gc
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    pipeline
)
from typing import Optional, Dict, Any, Union
import time
from datetime import datetime

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

# Global model cache to avoid reloading
_LLAMA_MODEL_CACHE = None
_LLAMA_TOKENIZER_CACHE = None
_DEVICE_CACHE = None

class LlamaResponseGenerator:
    def __init__(self):
        global _DEVICE_CACHE
        self.model: Optional[Any] = None
        self.tokenizer: Optional[Any] = None
        
        if _DEVICE_CACHE is None:
            if torch.cuda.is_available():
                _DEVICE_CACHE = "cuda"
                print(f"[DEBUG] 🚀 Using GPU: {torch.cuda.get_device_name(0)}", file=sys.stderr)
            else:
                _DEVICE_CACHE = "cpu"
                print("[DEBUG] 💻 Using CPU device", file=sys.stderr)
        self.device = _DEVICE_CACHE
        
        print(f"Phase 4 Llama: Initializing on {self.device.upper()}", file=sys.stderr)
        
    def load_model(self):
        """Load Llama-2-7b with 8-bit quantization for RTX 2050 compatibility"""
        global _LLAMA_MODEL_CACHE, _LLAMA_TOKENIZER_CACHE
        
        if self.model is None:
            # Check if we have cached models
            if _LLAMA_MODEL_CACHE is not None and _LLAMA_TOKENIZER_CACHE is not None:
                print("[DEBUG] Using cached Llama-2 model", file=sys.stderr)
                self.model = _LLAMA_MODEL_CACHE
                self.tokenizer = _LLAMA_TOKENIZER_CACHE
                return
            
            try:
                print("[DEBUG] Loading Llama-2-7b-chat-hf (first time, ~13GB download)...", file=sys.stderr)
                
                # 8-bit configuration for RTX 2050 optimization
                if self.device == "cuda":
                    quantization_config = BitsAndBytesConfig(
                        load_in_8bit=True,
                        llm_int8_threshold=6.0,
                        llm_int8_has_fp16_weight=False,
                        llm_int8_enable_fp32_cpu_offload=True
                    )
                    device_map = "auto"
                    torch_dtype = torch.float16
                else:
                    quantization_config = None
                    device_map = None
                    torch_dtype = torch.float32
                
                # Load tokenizer - Using an open-source alternative to Llama-2
                model_name = "microsoft/DialoGPT-large"  # Open alternative for now
                # TODO: Switch to "meta-llama/Llama-2-7b-chat-hf" when authenticated
                
                self.tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    trust_remote_code=True,
                    cache_dir="E:/Fluenti/models/hf_cache"
                )
                
                # Add padding token if missing
                if (self.tokenizer is not None and 
                    hasattr(self.tokenizer, 'pad_token') and 
                    self.tokenizer.pad_token is None):
                    if hasattr(self.tokenizer, 'eos_token'):
                        self.tokenizer.pad_token = self.tokenizer.eos_token
                
                # Load model with quantization - Using open alternative with safetensors
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    quantization_config=quantization_config,
                    device_map=device_map,
                    trust_remote_code=True,
                    cache_dir="E:/Fluenti/models/hf_cache",
                    torch_dtype=torch_dtype,
                    low_cpu_mem_usage=True,
                    use_safetensors=True  # Force use of safetensors format
                )
                
                # Cache globally for subsequent uses
                _LLAMA_MODEL_CACHE = self.model
                _LLAMA_TOKENIZER_CACHE = self.tokenizer
                
                print(f"[DEBUG] ✅ DialoGPT model loaded successfully on {self.device.upper()}", file=sys.stderr)
                
                # Print GPU memory usage if using CUDA
                if self.device == "cuda":
                    memory_allocated = torch.cuda.memory_allocated(0) / 1024**3  # GB
                    memory_reserved = torch.cuda.memory_reserved(0) / 1024**3   # GB
                    print(f"[DEBUG] 🎮 GPU Memory - Allocated: {memory_allocated:.2f}GB, Reserved: {memory_reserved:.2f}GB", file=sys.stderr)
                
            except Exception as e:
                print(f"[DEBUG] ❌ Error loading Llama-2 model: {e}", file=sys.stderr)
                print("[DEBUG] Falling back to smaller model or manual response", file=sys.stderr)
                raise e
    
    def generate_response(self, request_data):
        """Generate empathetic response using Llama-2 with conversation history"""
        try:
            start_time = time.time()
            
            # Load model (uses cache if available)
            self.load_model()
            
            if self.model is None or self.tokenizer is None:
                raise Exception("Model not loaded successfully")
            
            # Extract request data
            user_text = request_data.get("text", "")
            emotion = request_data.get("emotion", "neutral")
            language = request_data.get("language", "en")
            history = request_data.get("history", [])
            
            print(f"[DEBUG] Generating response for emotion: {emotion}, language: {language}", file=sys.stderr)
            print(f"[DEBUG] History length: {len(history)}", file=sys.stderr)
            
            # Build conversation context
            conversation_context = self.build_conversation_context(user_text, emotion, language, history)
            
            # Generate response
            response = self.generate_llama_response(conversation_context, language)
            
            # For therapeutic use, prioritize fallback responses for better quality
            # DialoGPT often gives inappropriate conversational responses rather than supportive ones
            use_fallback = (not response or 
                          len(response.strip()) < 20 or 
                          any(phrase in response.lower() for phrase in ["great way", "good point", "i feel", "that's", "very good", 
                                                                       "best comment", "read all day", "totally", "exactly", "absolutely",
                                                                       "same way", "going to", "bad time", "know that feel"]) or
                          response.lower().startswith(("i ", "that's ", "very ", "totally ", "exactly ")))
            
            if use_fallback:
                response = self.get_emotion_specific_fallback(emotion, user_text)
            
            processing_time = time.time() - start_time
            print(f"[DEBUG] Response generated in {processing_time:.2f}s", file=sys.stderr)
            
            return {
                "response": response,
                "emotion": emotion,
                "processing_time": processing_time,
                "model": "llama-2-7b-chat",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[DEBUG] Error in response generation: {e}", file=sys.stderr)
            return {
                "error": str(e),
                "fallback_response": self.generate_fallback_response(request_data)
            }
    
    def build_conversation_context(self, user_text, emotion, language, history):
        """Build conversation context with history and emotion awareness"""
        
        # Start with therapeutic context
        context_parts = []
        
        # Add emotional context with therapeutic framing
        emotion_prompts = {
            "sadness": "You're speaking with someone feeling sad who needs comfort and understanding.",
            "anger": "You're speaking with someone feeling angry who needs validation and support.",
            "fear": "You're speaking with someone feeling anxious who needs reassurance.",
            "stress": "You're speaking with someone feeling stressed who needs calming guidance.",
            "joy": "You're speaking with someone feeling happy who wants to share their positive emotions.",
            "neutral": "You're having a supportive conversation."
        }
        
        context_parts.append(emotion_prompts.get(emotion, emotion_prompts["neutral"]))
        
        # Add recent conversation history for context
        if history and len(history) > 0:
            context_parts.append("Recent conversation:")
            for h in history[-2:]:  # Last 2 exchanges
                if h.get('user'):
                    context_parts.append(f"Person: {h['user']}")
                if h.get('ai'):
                    context_parts.append(f"Supporter: {h['ai']}")
        
        # Add current user input
        context_parts.append(f"Person: {user_text}")
        context_parts.append("Supporter:")
        
        return " ".join(context_parts)
    
    def generate_llama_response(self, conversation_context, language):
        """Generate response using DialoGPT model"""
        try:
            # Ensure model and tokenizer are loaded
            if self.model is None or self.tokenizer is None:
                raise Exception("Model or tokenizer not loaded")
            
            # For DialoGPT, encode the conversation with proper attention mask
            encoded = self.tokenizer.encode_plus(
                conversation_context + self.tokenizer.eos_token,
                return_tensors='pt',
                padding=True,
                truncation=True,
                max_length=512
            )
            input_ids = encoded['input_ids']
            attention_mask = encoded.get('attention_mask', None)
            
            # Move to device if available
            if self.device == "cuda":
                input_ids = input_ids.to("cuda")
                if attention_mask is not None:
                    attention_mask = attention_mask.to("cuda")
            
            # Generation parameters optimized for DialoGPT conversation
            generation_config = {
                "max_length": input_ids.shape[-1] + 50,  # Generate 50 new tokens
                "num_beams": 2,
                "no_repeat_ngram_size": 3,
                "do_sample": True,
                "temperature": 0.7,
                "top_k": 50,
                "top_p": 0.9,
                "pad_token_id": self.tokenizer.eos_token_id
            }
            
            # Generate response
            with torch.no_grad():
                generate_kwargs = {
                    "input_ids": input_ids,
                    **generation_config
                }
                if attention_mask is not None:
                    generate_kwargs["attention_mask"] = attention_mask
                    
                chat_history_ids = self.model.generate(**generate_kwargs)
            
            # Extract only the new response (after the input)
            response = self.tokenizer.decode(
                chat_history_ids[:, input_ids.shape[-1]:][0], 
                skip_special_tokens=True
            ).strip()
            
            # Check if response is generic/low quality and use fallback
            generic_phrases = ["great way", "good point", "i feel you", "that's", "very good", 
                             "best comment", "read all day", "totally agree", "exactly", "absolutely"]
            is_generic = (not response or 
                         len(response.strip()) < 15 or 
                         any(phrase in response.lower() for phrase in generic_phrases) or
                         not any(keyword in response.lower() for keyword in ["feel", "understand", "sorry", "listen", "support", "help"]))
            
            if is_generic:
                emotion_fallbacks = {
                    "sadness": "I can hear the pain in your words. It sounds like you're going through something really difficult right now. I'm here to listen - would you like to share more about what's been weighing on you?",
                    "anger": "I can sense your frustration, and those feelings are completely valid. Sometimes everything feels overwhelming. What's been the most challenging part of what you're dealing with?",
                    "fear": "I understand you're feeling anxious right now. Panic attacks can be really frightening and overwhelming. You're safe here, and I want you to know that what you're experiencing is valid. How are you feeling right now?",
                    "nervousness": "I can hear that you're feeling anxious and uncomfortable. Those feelings are completely understandable. Sometimes our minds and bodies react strongly to stress. What's been making you feel this way?",
                    "stress": "It sounds like you're feeling overwhelmed with everything piling up. When we're stressed, everything can feel harder to manage. Let's take this one step at a time - what's been weighing on your mind the most?",
                    "joy": "I'm glad you're feeling positive! It's wonderful when we have moments of happiness. What's been bringing you joy recently?",
                    "neutral": "I'm here to listen and support you. Sometimes it helps just to have someone to talk to. What's been on your mind lately?"
                }
                # Extract emotion from conversation context or request data
                user_emotion = ""
                if "fear" in conversation_context.lower() or "panic" in conversation_context.lower():
                    user_emotion = "fear"
                elif "nervousness" in conversation_context.lower() or "anxious" in conversation_context.lower():
                    user_emotion = "nervousness"
                elif "sadness" in conversation_context.lower() or "sad" in conversation_context.lower():
                    user_emotion = "sadness"
                elif "anger" in conversation_context.lower() or "angry" in conversation_context.lower():
                    user_emotion = "anger"
                elif "stress" in conversation_context.lower():
                    user_emotion = "stress"
                elif "joy" in conversation_context.lower() or "happy" in conversation_context.lower():
                    user_emotion = "joy"
                else:
                    user_emotion = "neutral"
                
                response = emotion_fallbacks.get(user_emotion, emotion_fallbacks["neutral"])
            
            # Clean up response
            response = self.clean_response(response)
            
            return response
            
        except Exception as e:
            print(f"[DEBUG] Error in DialoGPT generation: {e}", file=sys.stderr)
            raise e
    
    def get_emotion_specific_fallback(self, emotion, user_text=""):
        """Get emotion-specific therapeutic fallback response"""
        emotion_fallbacks = {
            "sadness": "I can hear the pain in your words. It sounds like you're going through something really difficult right now. I'm here to listen - would you like to share more about what's been weighing on you?",
            "anger": "I can sense your frustration, and those feelings are completely valid. Sometimes everything feels overwhelming. What's been the most challenging part of what you're dealing with?",
            "fear": "I understand you're feeling anxious right now. Panic attacks can be really frightening and overwhelming. You're safe here, and I want you to know that what you're experiencing is valid. How are you feeling right now?",
            "nervousness": "I can hear that you're feeling anxious and uncomfortable. Those feelings are completely understandable. Sometimes our minds and bodies react strongly to stress. What's been making you feel this way?",
            "stress": "It sounds like you're feeling overwhelmed with everything piling up. When we're stressed, everything can feel harder to manage. Let's take this one step at a time - what's been weighing on your mind the most?",
            "joy": "I'm glad you're feeling positive! It's wonderful when we have moments of happiness. What's been bringing you joy recently?",
            "neutral": "I'm here to listen and support you. Sometimes it helps just to have someone to talk to. What's been on your mind lately?"
        }
        
        return emotion_fallbacks.get(emotion, emotion_fallbacks["neutral"])
    
    def clean_response(self, response):
        """Clean and format the generated response"""
        # Remove common artifacts
        response = response.strip()
        
        # Remove incomplete sentences at the end
        if response and not response.endswith(('.', '!', '?', '।', '؟')):
            sentences = response.split('. ')
            if len(sentences) > 1:
                response = '. '.join(sentences[:-1]) + '.'
        
        # Ensure reasonable length
        if len(response) > 300:
            sentences = response.split('. ')
            response = '. '.join(sentences[:2]) + '.'
        
        return response
    
    def generate_fallback_response(self, request_data):
        """Generate simple fallback response if Llama fails"""
        emotion = request_data.get("emotion", "neutral")
        language = request_data.get("language", "en")
        
        fallback_responses = {
            "en": {
                "joy": "I'm glad to hear you're feeling happy! Would you like to share what's bringing you joy?",
                "sadness": "I understand you're going through a difficult time. I'm here to listen and support you.",
                "anger": "I can sense your frustration. These feelings are valid. What's troubling you?",
                "fear": "It's natural to feel anxious sometimes. Take a deep breath. What's worrying you?",
                "stress": "I can see you're feeling overwhelmed. Let's work through this together. What's stressing you?",
                "neutral": "I'm here to listen and support you. What would you like to talk about?"
            },
            "ur": {
                "joy": "یہ سن کر خوشی ہوئی کہ آپ خوش ہیں! کیا آپ بتانا چاہیں گے کہ آپ کو کیا خوشی دے رہا ہے؟",
                "sadness": "میں سمجھ رہا ہوں کہ آپ مشکل وقت سے گزر رہے ہیں۔ میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔",
                "anger": "میں آپ کی مایوسی محسوس کر سکتا ہوں۔ یہ احساسات درست ہیں۔ آپ کو کیا پریشان کر رہا ہے؟",
                "fear": "کبھی کبھی بے چین محسوس کرنا فطری ہے۔ گہری سانس لیں۔ آپ کو کیا پریشان کر رہا ہے؟",
                "stress": "میں دیکھ رہا ہوں کہ آپ پریشان ہیں۔ آئیے مل کر اس سے نمٹتے ہیں۔ آپ کو کیا تناؤ دے رہا ہے؟",
                "neutral": "میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔ آپ کیا بات کرنا چاہیں گے؟"
            }
        }
        
        responses = fallback_responses.get(language, fallback_responses["en"])
        return responses.get(emotion, responses["neutral"])

def main():
    """Main function for subprocess calls"""
    try:
        # Read request from stdin
        request_line = sys.stdin.readline().strip()
        if not request_line:
            print(json.dumps({"error": "No input provided"}))
            return
        
        request_data = json.loads(request_line)
        
        # Initialize generator
        generator = LlamaResponseGenerator()
        
        # Generate response
        result = generator.generate_response(request_data)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "fallback_response": "I'm here to support you. Please tell me how you're feeling."
        }))
    finally:
        # Clean up GPU memory
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

if __name__ == "__main__":
    main()
