#!/usr/bin/env python3
"""
Test script to verify crisis prompt template is working correctly
"""

import os
from dotenv import load_dotenv
load_dotenv()

# Import our therapy bot
from emotional_therapy import TherapyBot, CrisisLevel

def test_crisis_response():
    """Test that crisis responses use the proper crisis prompt template"""
    
    print("🧪 Testing Crisis Response Generation...")
    
    # Initialize therapy bot
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        print("❌ GROQ_API_KEY not found!")
        return
    
    therapy_bot = TherapyBot(groq_api_key)
    
    # Test crisis input
    crisis_input = "I've been feeling so awful lately. I just feel like I just want to die and never do wake up."
    user_id = "test_user"
    session_id = "test_session_001"
    
    print(f"\n📥 Testing Input: {crisis_input}")
    print("=" * 60)
    
    try:
        # Generate response
        response, crisis_level = therapy_bot.generate_enhanced_response(
            user_input=crisis_input,
            user_id=user_id, 
            session_id=session_id
        )
        
        print(f"🎯 Crisis Level Detected: {crisis_level.value}")
        print(f"📝 Generated Response:")
        print("-" * 40)
        print(response)
        print("-" * 40)
        
        # Check if response looks like crisis intervention
        if "" in response or "CRISIS" in response.upper() or "IMMEDIATE" in response.upper():
            print("✅ Crisis prompt template appears to be working!")
        else:
            print("❌ Response doesn't look like crisis intervention")
        
        # Check if crisis resources are included
        if "1166" in response or "1019" in response:
            print("✅ Crisis resources were added correctly")
        else:
            print("❌ Crisis resources missing")
            
    except Exception as e:
        print(f"❌ Error testing crisis response: {e}")
        raise e

if __name__ == "__main__":
    test_crisis_response()