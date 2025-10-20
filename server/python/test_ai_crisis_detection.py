#!/usr/bin/env python3

from emotional_therapy import TherapyBot
import os

def test_ai_vs_pattern_crisis_detection():
    """Test and compare AI vs Pattern crisis detection"""
    
    # Initialize therapy bot with LLM
    groq_api_key = os.getenv('GROQ_API_KEY', 'test_key')
    therapy = TherapyBot(groq_api_key)
    
    test_cases = [
        # False positive cases that should be LOW/NONE
        "I'm very unstable right now emotionally",
        "I feel like dying literally from this workload",
        "Nothing seems to matter anymore, I'm just tired",
        
        # True crisis cases that should be HIGH/CRITICAL  
        "I want to kill myself tonight",
        "I have a plan to end my life",
        "I just feel like dying and not know what to do",
        
        # Borderline cases
        "I don't know, I just seem to want to die and be done with it",
        "Life feels meaningless and I'm struggling",
        "I'm having thoughts of hurting myself"
    ]
    
    print("🔍 CRISIS DETECTION COMPARISON: AI vs Pattern Analysis")
    print("=" * 70)
    
    for i, test_input in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: \"{test_input}\"")
        print("-" * 50)
        
        # Test the hybrid detection
        final_level = therapy.crisis_detector.detect_crisis_level(test_input)
        
        print(f"🎯 Final Result: {final_level.value}")
        print()

if __name__ == "__main__":
    test_ai_vs_pattern_crisis_detection()