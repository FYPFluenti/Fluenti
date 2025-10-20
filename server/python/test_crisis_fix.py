#!/usr/bin/env python3

from emotional_therapy import EmotionalTherapyService # pyright: ignore[reportAttributeAccessIssue]
import asyncio

async def test_crisis_detection():
    #!/usr/bin/env python3

from emotional_therapy import TherapyBot
import asyncio
import os

async def test_crisis_detection():
    # Initialize therapy bot (it has the crisis detection)
    groq_api_key = os.getenv('GROQ_API_KEY', 'test_key')
    therapy = TherapyBot(groq_api_key)
    
    # Test the original problematic input
    test_input = "I'm very unstable right now emotionally"
    print(f'Testing: "{test_input}"')
    
    result = therapy.detect_crisis_level(test_input)
    print(f'Crisis Level: {result}')
    print()
    
    # Test a real crisis phrase to ensure it still triggers
    crisis_input = "I want to kill myself right now"
    print(f'Testing: "{crisis_input}"')
    
    result2 = therapy.detect_crisis_level(crisis_input)
    print(f'Crisis Level: {result2}')
    print()

    # Test another emotional state that shouldn't trigger
    emotional_input = "I feel nothing matters anymore but I'm just tired"
    print(f'Testing: "{emotional_input}"')
    
    result3 = therapy.detect_crisis_level(emotional_input)
    print(f'Crisis Level: {result3}')

def test_crisis_detection():
    # Initialize therapy bot (it has the crisis detection)
    groq_api_key = os.getenv('GROQ_API_KEY', 'test_key')
    therapy = TherapyBot(groq_api_key)
    
    # Test the original problematic input
    test_input = "I'm very unstable right now emotionally"
    print(f'Testing: "{test_input}"')
    
    result = therapy.detect_crisis_level(test_input)
    print(f'Crisis Level: {result}')
    print()
    
    # Test a real crisis phrase to ensure it still triggers
    crisis_input = "I want to kill myself right now"
    print(f'Testing: "{crisis_input}"')
    
    result2 = therapy.detect_crisis_level(crisis_input)
    print(f'Crisis Level: {result2}')
    print()

    # Test another emotional state that shouldn't trigger
    emotional_input = "I feel nothing matters anymore but I'm just tired"
    print(f'Testing: "{emotional_input}"')
    
    result3 = therapy.detect_crisis_level(emotional_input)
    print(f'Crisis Level: {result3}')

if __name__ == "__main__":
    test_crisis_detection()