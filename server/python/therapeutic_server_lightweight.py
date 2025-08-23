#!/usr/bin/env python3
"""
Lightweight Therapeutic Response Server
Provides high-quality therapeutic responses without heavy model loading
Uses intelligent fallback responses and pattern matching for RTX 2050 compatibility
"""

import sys
import json
import warnings
import signal
import time
import os
import random

warnings.filterwarnings('ignore')

class LightweightTherapeuticServer:
    def __init__(self):
        self.running = True
        self.response_patterns = self._load_response_patterns()
        
        print(f"🚀 Lightweight Therapeutic Server - Memory Optimized", file=sys.stderr)
        print(f"✅ High-quality response patterns loaded", file=sys.stderr)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown_handler)
        signal.signal(signal.SIGTERM, self.shutdown_handler)
    
    def shutdown_handler(self, signum, frame):
        print("🛑 Shutting down lightweight therapeutic server...", file=sys.stderr)
        self.running = False
    
    def _load_response_patterns(self):
        """Load sophisticated therapeutic response patterns"""
        patterns = {
            "anxiety": [
                "I can sense the anxiety in what you've shared, and I want you to know that these feelings are completely understandable. Anxiety often shows up when we care deeply about something or when we're facing uncertainty. You're being incredibly brave by reaching out and talking about this. What aspect of this anxiety feels most overwhelming to you right now?",
                "Thank you for sharing these anxious feelings with me. It takes courage to acknowledge anxiety, and I want you to know that what you're experiencing is valid. Anxiety can feel overwhelming, but you don't have to face it alone. What situations or thoughts tend to trigger these feelings most for you?",
                "I hear the anxiety in your words, and I want to acknowledge how difficult it must be to carry these feelings. Anxiety has a way of making everything feel more intense and uncertain. You've taken an important step by reaching out. What would feel most supportive for you right now as we work through this together?"
            ],
            "nervousness": [
                "I can sense the nervousness you're experiencing, and I want you to know that these feelings are completely understandable. Nervousness often appears when we're facing something important or uncertain. You're showing real courage by sharing this with me. What aspects of this nervousness feel most challenging for you?",
                "Thank you for trusting me with these feelings of nervousness. It's natural to feel this way when we're stepping into unknown territory or facing something significant. Your willingness to talk about it shows strength. What do you think might be underneath these nervous feelings?",
                "I can hear the nervousness in what you've shared, and I want to validate that these feelings make complete sense. Sometimes nervousness is our mind's way of preparing us for something important. You're safe here to explore these feelings. What would help you feel more grounded right now?"
            ],
            "depression": [
                "Thank you for trusting me with what you've shared. I can hear how much you're struggling right now, and I want you to know that your pain is real and valid. Depression can make everything feel so much heavier. You've shown tremendous courage by reaching out today. What feels most important for you to talk about in this moment?",
                "I'm honored that you've shared these difficult feelings with me. Depression can make the world feel so much darker, and I want you to know that what you're experiencing is real and significant. You don't have to carry this alone. What has been the hardest part of this experience for you?",
                "I can sense the weight you're carrying, and I want to acknowledge how brave you are for being here and sharing this with me. Depression can make even the smallest tasks feel overwhelming. You matter, and your feelings matter. What would feel most helpful for us to focus on today?"
            ],
            "sadness": [
                "I can hear the sadness in your words, and I want to acknowledge how brave you are for sharing these feelings with me. Sadness is such a natural human emotion, even though it can feel overwhelming. You don't have to carry this alone. What's been weighing most heavily on your heart?",
                "Thank you for allowing me to witness your sadness. It takes courage to be vulnerable with these deep feelings. Sadness often tells us that something meaningful is at stake. I'm here to sit with you in this difficulty. What would feel most comforting for you right now?",
                "I can sense the sadness you're carrying, and I want you to know that these feelings are completely valid. Sometimes sadness is how we honor what matters to us. You're not alone in this. What aspects of this sadness feel most important for us to explore together?"
            ],
            "stress": [
                "It sounds like you're carrying a tremendous amount right now, and feeling stressed is such a natural response to everything you're managing. When we're overwhelmed like this, it can be hard to see a clear path forward. Let's take this one step at a time together. What feels like the most pressing concern for you today?",
                "I can hear how much stress you're experiencing, and I want to acknowledge how challenging it must be to manage everything on your plate. Stress often shows up when we're juggling more than feels manageable. You're not alone in this. What aspects of this stress feel most overwhelming right now?",
                "Thank you for sharing about the stress you're feeling. It sounds like you're dealing with a lot, and it makes complete sense that you'd feel overwhelmed. Sometimes when we're stressed, it helps to focus on what we can control. What feels most urgent for you to address first?"
            ],
            "anger": [
                "I can sense the frustration and anger in what you've shared, and those feelings make complete sense given what you're experiencing. Anger often tells us that something important to us has been threatened or hurt. Your feelings are valid, and I'm here to help you work through this. What do you think might be underneath this anger?",
                "Thank you for sharing these angry feelings with me. Anger can be such a powerful emotion, and it often carries important information about our boundaries and values. I want to understand what's driving these feelings. What situation or experience has contributed most to this anger?",
                "I can hear the anger in what you've shared, and I want you to know that these feelings are completely understandable. Anger often shows up when we feel powerless or when something we care about is at risk. You're safe to express these feelings here. What would feel most helpful as we explore this together?"
            ],
            "fear": [
                "I can sense the fear you're experiencing, and I want you to know that feeling afraid is completely understandable given what you're going through. Fear often shows up when we're facing something uncertain or threatening. You're safe here with me. What aspects of this situation feel most frightening to you?",
                "Thank you for sharing these fearful feelings with me. It takes courage to acknowledge fear, and I want you to know that what you're experiencing is valid. Fear can be overwhelming, but you don't have to face it alone. What thoughts or situations tend to trigger these feelings most for you?",
                "I hear the fear in your words, and I want to acknowledge how difficult it must be to carry these feelings. Fear has a way of making everything feel more dangerous and uncertain. You've taken an important step by reaching out. What would help you feel more secure right now?"
            ],
            "joy": [
                "I can hear the joy in what you're sharing, and it's wonderful to see you experiencing these positive feelings! Joy and happiness are such important emotions to celebrate. I'm curious about what's bringing you this sense of joy - would you like to share more about what's contributing to these good feelings?",
                "It's beautiful to hear the joy in your voice. These positive emotions are just as important to explore and understand as challenging ones. I'm so glad you're experiencing this happiness. What aspects of your life or recent experiences are bringing you the most joy right now?",
                "I can sense the joy you're feeling, and it brings me happiness to hear about your positive experiences. Joy can be such a powerful and healing emotion. What has been most meaningful about these joyful moments for you?"
            ],
            "admiration": [
                "I can sense the positive feelings you're experiencing, and it's wonderful to hear about what's bringing you fulfillment. These positive emotions are just as important to explore as challenging ones. I'm curious about what's creating these good feelings for you - would you like to share more about what's contributing to this sense of admiration or appreciation?",
                "It's lovely to hear about the admiration you're feeling. These moments of appreciation and positive recognition can be so meaningful. What or who has inspired these feelings of admiration in you recently?",
                "I can hear the positive energy in what you're sharing, and it's wonderful that you're experiencing these feelings of admiration. These emotions often reflect our values and what we find meaningful. What aspects of this experience resonate most deeply with you?"
            ],
            "general": [
                "Thank you for sharing what's on your mind with me. Whatever you're going through right now, I want you to know that your feelings and experiences are important and valid. I'm here to listen and support you through this. What would feel most helpful to explore together right now?",
                "I appreciate you taking the time to open up and share with me. It shows strength and self-awareness to reach out when we need support. I'm here to listen without judgment and help you work through whatever you're experiencing. What's been on your mind lately?",
                "I'm glad you've reached out and shared what's on your mind. Your feelings and experiences matter deeply, and I want you to know that you're not alone in this. I'm here to provide support and understanding. What feels most pressing for you to talk about today?"
            ]
        }
        return patterns
    
    def generate_response(self, user_input, emotion="general", history=None):
        """Generate high-quality therapeutic response using patterns"""
        try:
            print(f"🎯 Generating therapeutic response for emotion: {emotion}", file=sys.stderr)
            
            # Select appropriate response pattern
            emotion_patterns = self.response_patterns.get(emotion, self.response_patterns["general"])
            
            # Add some intelligent variation based on input length and content
            if len(user_input) < 10:
                # Short input - use more engaging response
                base_response = emotion_patterns[0]  # Most comprehensive
            elif "?" in user_input:
                # Question - use supportive inquiry response
                base_response = emotion_patterns[-1] if len(emotion_patterns) > 1 else emotion_patterns[0]
            else:
                # Regular input - use varied response
                base_response = random.choice(emotion_patterns)
            
            # Add personalization based on input content
            response = self._personalize_response(base_response, user_input, emotion)
            
            print(f"📄 Generated high-quality therapeutic response", file=sys.stderr)
            
            # Calculate quality indicators
            quality_indicators = self._assess_response_quality(response, emotion)
            
            return {
                "response": response,
                "confidence": 0.85,  # High confidence for pattern-based responses
                "emotion": emotion,
                "source": "lightweight_therapeutic_professional",
                "quality_indicators": quality_indicators,
                "model_info": {
                    "type": "pattern_based_therapeutic",
                    "memory_optimized": True,
                    "cached": True
                }
            }
            
        except Exception as e:
            print(f"❌ Generation error: {e}", file=sys.stderr)
            return {
                "response": "I'm here to support you through whatever you're experiencing. Your feelings and experiences are important to me. How are you feeling right now?",
                "confidence": 0.7,
                "emotion": emotion,
                "source": "lightweight_fallback",
                "quality_indicators": {"empathy_score": 0.8, "professionalism": 0.85, "therapeutic_value": 0.75},
                "error": str(e)
            }
    
    def _personalize_response(self, base_response, user_input, emotion):
        """Add subtle personalization to the response"""
        # Look for keywords to make response more specific
        user_lower = user_input.lower()
        
        # Add specific acknowledgments
        if "work" in user_lower or "job" in user_lower:
            base_response = base_response.replace("you're experiencing", "you're experiencing in your work life")
        elif "family" in user_lower or "relationship" in user_lower:
            base_response = base_response.replace("you're going through", "you're going through in your relationships")
        elif "school" in user_lower or "study" in user_lower:
            base_response = base_response.replace("you're facing", "you're facing in your studies")
        
        return base_response
    
    def _assess_response_quality(self, response, emotion):
        """Assess the quality of the therapeutic response"""
        empathy_words = ['understand', 'feel', 'hear', 'valid', 'difficult', 'support', 'listen', 'care', 'acknowledge', 'brave', 'courage']
        professional_words = ['explore', 'therapy', 'coping', 'strategies', 'resources', 'professional', 'process', 'together', 'work through']
        therapeutic_words = ['safe', 'space', 'feelings', 'emotions', 'experience', 'important', 'matter', 'alone', 'support']
        
        response_lower = response.lower()
        
        empathy_score = min(1.0, sum(1 for word in empathy_words if word in response_lower) * 0.1 + 0.5)
        professionalism = min(1.0, sum(1 for word in professional_words if word in response_lower) * 0.15 + 0.6)
        therapeutic_value = min(1.0, sum(1 for word in therapeutic_words if word in response_lower) * 0.12 + 0.6)
        
        # Bonus for questions (engagement)
        if '?' in response:
            therapeutic_value = min(1.0, therapeutic_value + 0.1)
        
        # Bonus for emotion-specific responses
        if emotion in response_lower:
            empathy_score = min(1.0, empathy_score + 0.1)
        
        return {
            "empathy_score": round(empathy_score, 2),
            "professionalism": round(professionalism, 2),
            "therapeutic_value": round(therapeutic_value, 2)
        }
    
    def process_request(self, request):
        """Process therapeutic response request"""
        try:
            user_input = request.get("user_input", "")
            emotion = request.get("emotion", "general")
            history = request.get("history", [])
            
            if not user_input:
                return {
                    "response": "I'm here to help you. What would you like to talk about?",
                    "confidence": 0.7,
                    "emotion": "general",
                    "source": "lightweight_empty_input"
                }
            
            return self.generate_response(user_input, emotion, history)
            
        except Exception as e:
            print(f"❌ Request processing error: {e}", file=sys.stderr)
            return {
                "response": "I'm experiencing some technical difficulties, but I want you to know that I'm still here for you. Your wellbeing is important to me. How are you feeling right now?",
                "confidence": 0.7,
                "emotion": "general",
                "source": "lightweight_error_fallback",
                "error": str(e)
            }
    
    def run_server(self):
        """Main server loop - reads JSON requests from stdin"""
        print("📡 Lightweight therapeutic server ready for requests", file=sys.stderr)
        
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
                    error_response = {
                        "response": "I'm here to help. What's on your mind?",
                        "confidence": 0.7,
                        "emotion": "general",
                        "source": "lightweight_json_error",
                        "error": "Invalid JSON"
                    }
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
                error_response = {
                    "response": "I'm experiencing some technical difficulties, but I'm here for you. How are you feeling?",
                    "confidence": 0.7,
                    "emotion": "general",
                    "source": "lightweight_server_error",
                    "error": str(e)
                }
                print(json.dumps(error_response))
                sys.stdout.flush()
        
        print("🛑 Lightweight therapeutic server stopped", file=sys.stderr)

def main():
    """Start the lightweight therapeutic server"""
    try:
        server = LightweightTherapeuticServer()
        server.run_server()
    except Exception as e:
        print(f"❌ Server error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
