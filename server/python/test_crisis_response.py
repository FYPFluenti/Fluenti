#!/usr/bin/env python3

from emotional_therapy import TherapyBot
import os

def test_crisis_response():
    # Initialize therapy bot 
    groq_api_key = os.getenv('GROQ_API_KEY', 'test_key')
    therapy = TherapyBot(groq_api_key)
    
    # Test crisis message
    crisis_input = "I just feel like dying."
    print(f'Testing crisis response for: "{crisis_input}"')
    print('-' * 50)
    
    # Test crisis detection level
    crisis_level = therapy.crisis_detector.detect_crisis_level(crisis_input)
    print(f'Crisis Level Detected: {crisis_level}')
    
    # Test the full response generation
    try:
        response, detected_crisis_level = therapy.generate_enhanced_response(
            user_input=crisis_input,
            user_id="test_user",
            session_id="test_session"
        )
        
        print(f'Full Response:')
        print(f'"{response}"')
        print(f'\nResponse Length: {len(response)} characters')
        print(f'Crisis Level from Response: {detected_crisis_level}')
        
        # Check for Pakistan helplines
        if "1019" in response or "1166" in response:
            print("✅ Contains Pakistan helplines")
        else:
            print("❌ Missing Pakistan helplines")
            
        # Check for US helplines (should not be present)
        if "988" in response or "741741" in response:
            print("❌ Still contains US helplines")
        else:
            print("✅ No US helplines found")
            
    except Exception as e:
        print(f"Error testing response: {e}")

if __name__ == "__main__":
    test_crisis_response()