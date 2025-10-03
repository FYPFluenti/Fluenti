#!/usr/bin/env python3
"""
Simple test script to verify the therapy service installation
"""

import sys
import os

def test_python_version():
    """Test Python version"""
    print("🐍 Testing Python version...")
    if sys.version_info >= (3, 8):
        print(f"   ✅ Python {sys.version.split()[0]} - OK")
        return True
    else:
        print(f"   ❌ Python {sys.version.split()[0]} - Need 3.8+")
        return False

def test_imports():
    """Test critical imports"""
    print("📦 Testing imports...")
    
    # Test Flask
    try:
        import flask
        print("   ✅ Flask - OK")
        flask_ok = True
    except ImportError:
        print("   ❌ Flask - Missing")
        flask_ok = False
    
    # Test Flask-CORS
    try:
        import flask_cors
        print("   ✅ Flask-CORS - OK")
        cors_ok = True
    except ImportError:
        print("   ❌ Flask-CORS - Missing")
        cors_ok = False
    
    return flask_ok and cors_ok

def test_therapy_components():
    """Test therapy bot components"""
    print("🤖 Testing therapy components...")
    
    try:
        from emotional_therapy import therapy_bot, interface, TherapyInterface, CrisisLevel
        
        if therapy_bot is not None:
            print("   ✅ therapy_bot - OK")
        else:
            print("   ⚠️ therapy_bot - None (may need API key)")
            
        if TherapyInterface is not None:
            print("   ✅ TherapyInterface - OK")
        else:
            print("   ❌ TherapyInterface - None")
            
        print("   ✅ Therapy components imported successfully")
        return True
        
    except ImportError as e:
        print(f"   ❌ Therapy components - {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("🧪 Therapy Service Installation Test")
    print("=" * 40)
    
    tests = [
        ("Python Version", test_python_version),
        ("Flask Dependencies", test_imports),
        ("Therapy Components", test_therapy_components)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
            print()
        except Exception as e:
            print(f"   ❌ Test failed with error: {e}")
            results.append((name, False))
            print()
    
    # Summary
    print("📋 Test Summary:")
    print("-" * 20)
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name}: {status}")
        if not result:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 All tests passed! Service should work correctly.")
        print("💡 Run: python therapy_service.py")
    else:
        print("⚠️ Some tests failed. Check the issues above.")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()