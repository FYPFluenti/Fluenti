#!/usr/bin/env python3
"""
Test script for the Emotional Therapy Service
Usage: python test_service.py [service_url]
Example: python test_service.py https://your-therapy-service.onrender.com
"""

import sys
import requests
import json
from typing import Optional

# Default service URL (change this to your deployed service URL)
DEFAULT_SERVICE_URL = "https://your-therapy-service.onrender.com"

def test_health_check(service_url: str) -> bool:
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("1. Testing Health Check Endpoint")
    print("="*60)
    
    try:
        url = f"{service_url}/health"
        print(f"GET {url}")
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Therapy Bot Available: {data.get('therapy_bot_available')}")
            print(f"   Interface Available: {data.get('interface_available')}")
            
            crisis_detection = data.get('crisis_detection', {})
            print(f"   Crisis Detection Mode: {crisis_detection.get('detection_mode', 'unknown')}")
            print(f"   AI Enabled: {crisis_detection.get('ai_enabled', False)}")
            
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to service: {e}")
        return False

def test_start_session(service_url: str, user_id: str = "test_user_123") -> Optional[dict]:
    """Test starting a therapy session"""
    print("\n" + "="*60)
    print("2. Testing Start Session Endpoint")
    print("="*60)
    
    try:
        url = f"{service_url}/api/therapy/start-session"
        payload = {"userId": user_id}
        
        print(f"POST {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Session started successfully!")
            print(f"   Session ID: {data.get('sessionId')}")
            print(f"   User ID: {data.get('userId')}")
            print(f"   Welcome Message: {data.get('welcomeMessage', '')[:100]}...")
            return data
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def test_chat(service_url: str, session_key: str, user_id: str, session_id: str, message: str) -> Optional[dict]:
    """Test sending a chat message"""
    print("\n" + "="*60)
    print("3. Testing Chat Endpoint")
    print("="*60)
    
    try:
        url = f"{service_url}/api/therapy/chat"
        payload = {
            "message": message,
            "sessionKey": session_key,
            "userId": user_id,
            "sessionId": session_id
        }
        
        print(f"POST {url}")
        print(f"Message: {message}")
        
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Chat message sent successfully!")
            print(f"   Response: {data.get('response', '')[:200]}...")
            print(f"   Crisis Level: {data.get('crisisLevel', 'none')}")
            print(f"   Is Crisis: {data.get('isCrisis', False)}")
            return data
        else:
            print(f"❌ Failed to send message: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def test_psychological_profile(service_url: str, user_id: str) -> bool:
    """Test getting psychological profile"""
    print("\n" + "="*60)
    print("4. Testing Psychological Profile Endpoint")
    print("="*60)
    
    try:
        url = f"{service_url}/api/therapy/psychological-profile"
        params = {"userId": user_id}
        
        print(f"GET {url}?userId={user_id}")
        
        response = requests.get(url, params=params, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Profile retrieved successfully!")
            profile = data.get('profile', {})
            print(f"   Profile Exists: {profile.get('profileExists', False)}")
            print(f"   Session Count: {profile.get('sessionCount', 0)}")
            return True
        else:
            print(f"❌ Failed to get profile: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    # Get service URL from command line or use default
    service_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SERVICE_URL
    
    # Remove trailing slash if present
    service_url = service_url.rstrip('/')
    
    print("\n" + "="*60)
    print("🧪 Emotional Therapy Service Test Suite")
    print("="*60)
    print(f"Service URL: {service_url}")
    
    # Test 1: Health Check
    if not test_health_check(service_url):
        print("\n❌ Health check failed. Service may not be running.")
        return
    
    # Test 2: Start Session
    session_data = test_start_session(service_url)
    if not session_data:
        print("\n❌ Failed to start session. Cannot continue with chat tests.")
        return
    
    session_key = session_data.get('sessionKey')
    user_id = session_data.get('userId')
    session_id = session_data.get('sessionId')
    
    # Test 3: Send Chat Message
    test_chat(
        service_url, 
        session_key, 
        user_id, 
        session_id,
        "Hello, I've been feeling stressed lately. Can you help me?"
    )
    
    # Test 4: Get Psychological Profile
    test_psychological_profile(service_url, user_id)
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)

if __name__ == "__main__":
    main()

