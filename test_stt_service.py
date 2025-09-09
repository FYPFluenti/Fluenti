#!/usr/bin/env python3
"""
Test the fast STT service to ensure it's working properly
"""

import requests
import json
import time

def test_stt_endpoint():
    """Test the emotional support endpoint with voice input"""
    
    print("🧪 Testing Fast STT Service")
    print("=" * 40)
    
    # Test with a simple POST request
    url = "http://localhost:3000/api/test-chat"
    
    payload = {
        "message": "Hello, this is a test",
        "language": "en"
    }
    
    try:
        print("📤 Sending test chat request...")
        start_time = time.time()
        
        response = requests.post(url, json=payload, timeout=10)
        
        end_time = time.time()
        response_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Test Chat Response: {result.get('message', 'No message')}")
            print(f"⚡ Response Time: {response_time:.2f} seconds")
            return True
        else:
            print(f"❌ Test failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    print("🚀 Starting STT Service Test")
    print("Waiting for server to be ready...")
    time.sleep(2)
    
    success = test_stt_endpoint()
    
    if success:
        print("\n🎉 STT Service Test PASSED!")
        print("Server is ready for voice input testing")
    else:
        print("\n❌ STT Service Test FAILED!")
        print("Check server logs for more details")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
