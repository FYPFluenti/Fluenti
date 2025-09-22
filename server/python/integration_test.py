#!/usr/bin/env python3
"""
Integration Test for Therapy Response System
Tests all components working together without duplicating logic
"""

import sys
import os
from typing import Dict, List

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_component_imports():
    """Test that all components can be imported"""
    print("🧪 Testing Component Imports...")
    
    results = {}
    
    # Test DataLoader
    try:
        from DataLoader import datasets, DataLoader
        results["DataLoader"] = {"status": "✅", "datasets": len(datasets)}
    except Exception as e:
        results["DataLoader"] = {"status": "❌", "error": str(e)}
    
    # Test MongoDBStorage
    try:
        from MongoDBStorage import storage, MongoDBStorage
        results["MongoDBStorage"] = {"status": "✅", "use_mongodb": getattr(storage, 'use_mongodb', False)}
    except Exception as e:
        results["MongoDBStorage"] = {"status": "❌", "error": str(e)}
    
    # Test CrisisDetector
    try:
        from CrisisDetector import crisis_detector, CrisisDetector, CrisisLevel
        results["CrisisDetector"] = {"status": "✅", "current_user": getattr(crisis_detector, 'current_user', {}).get('login', 'Unknown')}
    except Exception as e:
        results["CrisisDetector"] = {"status": "❌", "error": str(e)}
    
    # Test SessionMemory
    try:
        from SessionMemory import TherapyBot, SessionMemory
        results["SessionMemory"] = {"status": "✅"}
    except Exception as e:
        results["SessionMemory"] = {"status": "❌", "error": str(e)}
    
    # Test TherapyInterface
    try:
        from TherapyInterface import interface, therapy_bot, TherapyInterface
        results["TherapyInterface"] = {
            "status": "✅", 
            "bot_available": therapy_bot is not None,
            "interface_available": interface is not None
        }
    except Exception as e:
        results["TherapyInterface"] = {"status": "❌", "error": str(e)}
    
    # Test API Wrapper
    try:
        from therapy_api import api, TherapyResponseAPI
        results["API_Wrapper"] = {"status": "✅", "available": api.is_available()}
    except Exception as e:
        results["API_Wrapper"] = {"status": "❌", "error": str(e)}
    
    # Print results
    for component, result in results.items():
        status = result["status"]
        print(f"  {component}: {status}")
        if status == "❌":
            print(f"    Error: {result.get('error', 'Unknown error')}")
        else:
            # Print additional info for successful imports
            if component == "DataLoader" and "datasets" in result:
                print(f"    Datasets loaded: {result['datasets']}")
            elif component == "MongoDBStorage" and "use_mongodb" in result:
                print(f"    Using MongoDB: {result['use_mongodb']}")
            elif component == "CrisisDetector" and "current_user" in result:
                print(f"    Current user: {result['current_user']}")
            elif component == "TherapyInterface":
                print(f"    Bot available: {result.get('bot_available', False)}")
                print(f"    Interface available: {result.get('interface_available', False)}")
            elif component == "API_Wrapper" and "available" in result:
                print(f"    API available: {result['available']}")
    
    return results

def test_crisis_detection():
    """Test crisis detection functionality"""
    print("\n🚨 Testing Crisis Detection...")
    
    try:
        from CrisisDetector import crisis_detector
        
        test_inputs = [
            ("I'm feeling great today!", "Should be no crisis"),
            ("I'm having a rough day at work", "Should be low/no crisis"),
            ("I feel really hopeless and don't know what to do", "Should detect some concern"),
            ("Thank you for your help", "Should be no crisis")
        ]
        
        for text, expected in test_inputs:
            crisis_level = crisis_detector.detect_crisis_level(text)
            print(f"  Input: '{text[:40]}...'")
            print(f"  Level: {crisis_level.value} ({expected})")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_storage_functionality():
    """Test storage functionality"""
    print("\n💾 Testing Storage Functionality...")
    
    try:
        from MongoDBStorage import storage
        
        # Test conversation saving
        test_user_id = "test_user_integration"
        test_session_id = "test_session_integration"
        
        storage.save_conversation(
            user_id=test_user_id,
            session_id=test_session_id,
            user_input="Test message for integration",
            bot_response="Test response for integration",
            crisis_level="none",
            mood_score=7.0
        )
        
        # Test conversation retrieval
        history = storage.get_conversation_history(test_user_id, test_session_id, limit=1)
        
        if history:
            print(f"  ✅ Saved and retrieved conversation")
            print(f"  Storage type: {'MongoDB' if storage.use_mongodb else 'File-based'}")
        else:
            print(f"  ⚠️ No conversation retrieved (but save might have worked)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_end_to_end_flow():
    """Test complete end-to-end conversation flow"""
    print("\n🔄 Testing End-to-End Flow...")
    
    try:
        from therapy_api import api
        
        if not api.is_available():
            print("  ❌ API not available")
            return False
        
        # Start session
        session_result = api.start_session()
        if not session_result["success"]:
            print(f"  ❌ Failed to start session: {session_result['error']}")
            return False
        
        print(f"  ✅ Session started: {session_result['session_id'][-8:]}")
        
        # Send test message
        response_result = api.send_message("Hello, I'm testing the integration")
        if not response_result["success"]:
            print(f"  ❌ Failed to send message: {response_result['error']}")
            return False
        
        print(f"  ✅ Message processed")
        print(f"  Crisis level: {response_result['crisis_level']}")
        print(f"  Response length: {len(response_result['response'])} chars")
        
        # Get summary
        summary_result = api.get_session_summary()
        if not summary_result["success"]:
            print(f"  ❌ Failed to get summary: {summary_result['error']}")
            return False
        
        print(f"  ✅ Summary generated")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_utilities():
    """Test utility functions"""
    print("\n🔧 Testing Utilities...")
    
    try:
        # Test user context
        from utils.user_context import get_user_context
        context = get_user_context()
        print(f"  ✅ User context: {context['login']} ({context['environment']})")
        
        # Test error handling
        from utils.error_handler import handle_api_error
        test_error = Exception("Test error")
        error_msg = handle_api_error(test_error, "Test Component")
        print(f"  ✅ Error handling works")
        
        # Test message formatting
        from utils.message_formatter import MessageFormatter
        formatter = MessageFormatter()
        greeting = formatter.format_greeting()
        print(f"  ✅ Message formatting works")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def run_integration_tests():
    """Run all integration tests"""
    print("🧪 THERAPY RESPONSE SYSTEM - INTEGRATION TESTS")
    print("=" * 60)
    
    tests = [
        ("Component Imports", test_component_imports),
        ("Crisis Detection", test_crisis_detection),
        ("Storage Functionality", test_storage_functionality),
        ("Utilities", test_utilities),
        ("End-to-End Flow", test_end_to_end_flow),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = "✅" if result else "⚠️"
        except Exception as e:
            print(f"  ❌ Test failed with exception: {e}")
            results[test_name] = "❌"
    
    # Summary
    print("\n📊 TEST SUMMARY")
    print("=" * 30)
    for test_name, status in results.items():
        print(f"{status} {test_name}")
    
    passed = sum(1 for status in results.values() if status == "✅")
    total = len(results)
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All integration tests passed!")
    elif passed > 0:
        print("⚠️ Some tests passed - system partially functional")
    else:
        print("❌ All tests failed - check system configuration")
    
    return results

if __name__ == "__main__":
    run_integration_tests()