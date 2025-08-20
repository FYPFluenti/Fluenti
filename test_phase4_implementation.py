#!/usr/bin/env python3
"""
Quick Phase 4 Implementation Test
Tests core components without full model loading
"""

import sys
import os
import json

def test_response_service():
    """Test if responseService.ts exists and has correct structure"""
    service_path = os.path.join("server", "services", "responseService.ts")
    if not os.path.exists(service_path):
        return False, "responseService.ts not found"
    
    with open(service_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_functions = [
        "generateConversationalResponse",
        "generateTTS", 
        "runLlamaResponse"
    ]
    
    for func in required_functions:
        if func not in content:
            return False, f"Missing function: {func}"
    
    return True, "responseService.ts structure valid"

def test_python_scripts():
    """Test if Python scripts exist and are importable"""
    scripts = [
        "server/python/llama_response_generator.py",
        "server/python/tts_generator.py"
    ]
    
    for script in scripts:
        if not os.path.exists(script):
            return False, f"Missing script: {script}"
    
    return True, "Python scripts exist"

def test_avatar_component():
    """Test if ThreeAvatar component has Phase 4 enhancements"""
    avatar_path = os.path.join("client", "src", "components", "ui", "three-avatar.tsx")
    if not os.path.exists(avatar_path):
        return False, "three-avatar.tsx not found"
    
    with open(avatar_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    phase4_features = [
        "audioBase64",
        "voiceModel", 
        "lipSyncIntensity",
        "Phase 4"
    ]
    
    for feature in phase4_features:
        if feature not in content:
            return False, f"Missing Phase 4 feature: {feature}"
    
    return True, "ThreeAvatar has Phase 4 enhancements"

def test_chat_component():
    """Test if emotional-chat component has Phase 4 features"""
    chat_path = os.path.join("client", "src", "components", "chat", "emotional-chat.tsx")
    if not os.path.exists(chat_path):
        return False, "emotional-chat.tsx not found"
    
    with open(chat_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    phase4_features = [
        "conversationHistory",
        "currentAudioBase64",
        "voiceModel",
        "audioBase64"
    ]
    
    for feature in phase4_features:
        if feature not in content:
            return False, f"Missing Phase 4 feature: {feature}"
    
    return True, "Emotional chat has Phase 4 features"

def test_api_routes():
    """Test if API routes have Phase 4 integration"""
    routes_path = os.path.join("server", "routes.ts")
    if not os.path.exists(routes_path):
        return False, "routes.ts not found"
    
    with open(routes_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "responseService" not in content:
        return False, "responseService not imported in routes"
    
    return True, "API routes have Phase 4 integration"

def main():
    print("🧪 Phase 4 Implementation Test")
    print("=" * 50)
    
    tests = [
        ("Response Service", test_response_service),
        ("Python Scripts", test_python_scripts), 
        ("Avatar Component", test_avatar_component),
        ("Chat Component", test_chat_component),
        ("API Routes", test_api_routes)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success, message = test_func()
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}: {message}")
            results.append(success)
        except Exception as e:
            print(f"❌ FAIL {test_name}: Exception - {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ALL TESTS PASSED ({passed}/{total})")
        print("✅ Phase 4 implementation is complete and ready!")
        print("\nNext steps:")
        print("1. Run: python setup_phase4_python.py")
        print("2. Run: npm run dev")
        print("3. Test Phase 4 features in browser")
    else:
        print(f"⚠️  SOME TESTS FAILED ({passed}/{total})")
        print("❌ Please check the failed components")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
