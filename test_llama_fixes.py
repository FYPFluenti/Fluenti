#!/usr/bin/env python3
"""
Quick test for Llama Response Generator fixes
"""

import json
import sys
from server.python.llama_response_generator import LlamaResponseGenerator

def test_llama_response():
    print("🧪 Testing Llama Response Generator fixes...")
    
    # Test data
    test_request = {
        "text": "I am feeling really anxious today",
        "emotion": "fear",
        "language": "en",
        "history": [],
        "userContext": {"preferences": ["empathetic", "supportive"]}
    }
    
    try:
        # Initialize generator
        generator = LlamaResponseGenerator()
        
        # Generate response
        result = generator.generate_response(test_request)
        
        print("✅ Response generation test passed!")
        print(f"Response: {result.get('response', 'No response')}")
        print(f"Model: {result.get('model', 'Unknown')}")
        print(f"Processing time: {result.get('processing_time', 0):.2f}s")
        
        # Check if response is valid
        if 'response' in result and len(result['response']) > 20:
            print("✅ Response quality: Good")
        else:
            print("⚠️ Response quality: Poor or missing")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_llama_response()
    if success:
        print("\n🎉 All tests passed! Llama Response Generator is working.")
    else:
        print("\n💥 Tests failed. Check the error messages above.")
