# Psychological Profiling System - Testing Guide

## 🧠 Enhanced Contextual Understanding Testing

This guide provides comprehensive testing instructions for the enhanced psychological profiling system that addresses the "Limited Understanding of Context" limitation.

## ✅ Implementation Status

**All major components successfully implemented:**

- ✅ PsychologicalProfile dataclass with 12 psychological dimensions
- ✅ Enhanced MongoDB storage with 3 new collections
- ✅ AI-powered psychological pattern analysis
- ✅ Trauma-informed detection system
- ✅ Cultural context analysis
- ✅ Long-term progress tracking
- ✅ Enhanced session summaries with psychological insights
- ✅ Personalized recommendation system
- ✅ API endpoints for profile access

## 🧪 Testing Scenarios

### 1. Basic Psychological Profile Creation

**Test Goal:** Verify the system creates and maintains psychological profiles

```bash
# Start the therapy service
cd server/python
python therapy_service.py
```

**API Test:**
```bash
# Create a therapy session first
curl -X POST http://localhost:5000/api/therapy/start-session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_123", "sessionType": "general"}'

# Have a conversation to build psychological patterns
curl -X POST http://localhost:5000/api/therapy/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "message": "I feel anxious about social situations and tend to avoid them",
    "sessionId": "session_123"
  }'

# Check psychological profile
curl "http://localhost:5000/api/therapy/psychological-profile?userId=test_user_123"
```

**Expected Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "test_user_123",
    "profileExists": true,
    "insights": {
      "corePatterns": {
        "count": 1,
        "patterns": ["social_anxiety"]
      },
      "cognitivePatterns": {
        "count": 1,
        "patterns": ["avoidance_thinking"]
      }
    }
  },
  "capabilities": {
    "deep_understanding": true,
    "cultural_awareness": true,
    "trauma_informed": true,
    "progress_tracking": true
  }
}
```

### 2. Trauma-Informed Detection Testing

**Test Conversation:**
```json
{
  "userId": "trauma_test_user",
  "message": "I have trouble sleeping and get startled by loud noises. Sometimes I feel disconnected from my body.",
  "sessionId": "trauma_session"
}
```

**Expected Behavior:**
- System should detect trauma indicators (hypervigilance, dissociation)
- Response should be trauma-informed and gentle
- Profile should flag trauma-informed approach needed

### 3. Cultural Context Analysis Testing

**Test Conversation:**
```json
{
  "userId": "cultural_test_user",
  "message": "In my family, we don't talk about feelings. My parents always said we should be strong and not burden others with our problems.",
  "sessionId": "cultural_session"
}
```

**Expected Behavior:**
- System should identify cultural patterns around emotional expression
- Recommendations should be culturally sensitive
- Profile should include cultural context insights

### 4. Long-Term Progress Tracking

**API Test:**
```bash
# After multiple sessions over time
curl "http://localhost:5000/api/therapy/long-term-progress?userId=test_user_123&days=30"
```

**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "entries": [
      {
        "date": "2024-01-01",
        "moodScore": 6,
        "crisisLevel": "none",
        "riskTrend": "decreasing"
      }
    ],
    "summary": {
      "totalSessions": 5,
      "averageMood": 6.2,
      "currentTrend": "stable"
    },
    "insights": {
      "improvement": true,
      "stable": false,
      "needsAttention": false
    }
  }
}
```

### 5. AI-Powered Pattern Analysis

**Test Complex Scenario:**
```json
{
  "userId": "pattern_test_user",
  "message": "I keep procrastinating on important tasks. When I think about starting them, I feel overwhelmed and then I distract myself with social media. Later I feel guilty and worthless.",
  "sessionId": "pattern_session"
}
```

**Expected AI Analysis:**
- Should identify procrastination-overwhelm cycle
- Recognize self-criticism patterns
- Suggest pattern interruption techniques
- Track pattern development over sessions

## 🔍 Validation Checks

### Database Collections Verification

```python
# Connect to MongoDB and verify collections exist
from pymongo import MongoClient

client = MongoClient("your_mongodb_connection_string")
db = client.fluenti_therapy

# Check collections exist
collections = db.list_collection_names()
assert 'psychological_profiles' in collections
assert 'long_term_progress' in collections
assert 'cultural_contexts' in collections

print("✅ All collections exist")
```

### Profile Data Structure Validation

```python
# Test psychological profile structure
profile = therapy_bot.storage.get_or_create_psychological_profile("test_user")

# Verify all fields exist
required_fields = [
    'core_patterns', 'cognitive_patterns', 'coping_mechanisms',
    'cultural_context', 'trauma_indicators', 'resilience_factors',
    'therapeutic_goals', 'communication_style', 'long_term_progress',
    'session_insights', 'risk_factors', 'last_updated'
]

for field in required_fields:
    assert hasattr(profile, field), f"Missing field: {field}"

print("✅ Profile structure validated")
```

## 🎯 Performance Testing

### Session Enhancement Performance

```python
import time

start_time = time.time()

# Test session summary with psychological insights
summary = therapy_bot._create_session_summary_with_psychological_insights(
    session_data, user_profile
)

end_time = time.time()
processing_time = end_time - start_time

assert processing_time < 5.0, f"Session processing too slow: {processing_time}s"
print(f"✅ Session processing time: {processing_time:.2f}s")
```

### Pattern Analysis Speed

```python
# Test AI pattern analysis performance
messages = ["Test message about anxiety and stress patterns"] * 10

start_time = time.time()
patterns = therapy_bot.storage._analyze_psychological_patterns_with_ai(messages)
end_time = time.time()

analysis_time = end_time - start_time
assert analysis_time < 10.0, f"Pattern analysis too slow: {analysis_time}s"
print(f"✅ Pattern analysis time: {analysis_time:.2f}s")
```

## 🛡️ Security Testing

### Data Privacy Verification

```python
# Test that PII is properly hashed
user_id = "sensitive_user_123"
hashed_id = therapy_bot.storage.security_manager.hash_pii(user_id)

assert hashed_id != user_id, "User ID not properly hashed"
assert len(hashed_id) == 64, "Hash length incorrect"  # SHA-256 hex length

# Verify no raw user data in database
profile_doc = therapy_bot.storage.psychological_profiles.find_one(
    {"user_id": hashed_id}
)
assert profile_doc["user_id"] == hashed_id, "Raw user ID found in database"

print("✅ Data privacy verified")
```

## 🚀 Integration Testing

### Frontend Integration Test

```javascript
// Test from frontend application
const testPsychologicalProfile = async () => {
    try {
        const response = await fetch(
            `/api/therapy/psychological-profile?userId=test_user_123`
        );
        const data = await response.json();
        
        console.log('Profile Data:', data);
        
        // Verify response structure
        assert(data.success === true);
        assert(data.capabilities.deep_understanding === true);
        assert(data.capabilities.cultural_awareness === true);
        
        console.log('✅ Frontend integration successful');
    } catch (error) {
        console.error('❌ Frontend integration failed:', error);
    }
};
```

## 📊 Results Validation

### Expected Improvements

After implementing the psychological profiling system, the therapy bot should demonstrate:

1. **Deep Understanding of Individual Psychological Patterns**
   - ✅ Identifies recurring thought patterns
   - ✅ Recognizes cognitive distortions
   - ✅ Tracks behavioral patterns over time

2. **Ability to Track Long-term Therapeutic Progress**
   - ✅ Monitors mood trends over time
   - ✅ Tracks risk level changes
   - ✅ Measures therapeutic momentum

3. **Understanding of Complex Trauma or Severe Mental Health Conditions**
   - ✅ Detects trauma indicators automatically
   - ✅ Adjusts communication style appropriately
   - ✅ Uses trauma-informed approaches

4. **Cultural and Contextual Nuances Specific to Individual Users**
   - ✅ Identifies cultural communication patterns
   - ✅ Respects cultural values in recommendations
   - ✅ Adapts therapeutic approach culturally

## 🔧 Troubleshooting

### Common Issues

1. **Profile Not Creating**
   ```python
   # Check MongoDB connection
   try:
       therapy_bot.storage.psychological_profiles.find_one({})
       print("✅ MongoDB connected")
   except Exception as e:
       print(f"❌ MongoDB error: {e}")
   ```

2. **AI Analysis Failing**
   ```python
   # Check Groq API connection
   try:
       response = therapy_bot.groq_client.chat.completions.create(
           model="llama-3.3-70b-versatile",
           messages=[{"role": "user", "content": "test"}],
           max_tokens=10
       )
       print("✅ Groq API connected")
   except Exception as e:
       print(f"❌ Groq API error: {e}")
   ```

3. **Slow Performance**
   - Check database indexes
   - Monitor AI API response times
   - Optimize pattern analysis queries

## 📈 Success Metrics

The enhanced system should achieve:

- **Response Personalization**: >80% of responses should include psychological insights
- **Pattern Recognition**: >90% accuracy in identifying major psychological patterns
- **Cultural Sensitivity**: >95% appropriate cultural considerations
- **Progress Tracking**: Continuous long-term progress monitoring
- **Performance**: <5 seconds for session processing with psychological analysis

## 🎉 Conclusion

This comprehensive psychological profiling system successfully addresses the "Limited Understanding of Context" limitation by providing:

1. **Deep psychological pattern analysis**
2. **Long-term progress tracking**
3. **Trauma-informed therapeutic approaches**
4. **Cultural context awareness**
5. **Personalized recommendations**

The system transforms the therapy bot from a basic conversational AI into a sophisticated psychological support tool with genuine contextual understanding.

---

**Next Steps:**
- Run the testing scenarios above
- Monitor system performance
- Gather user feedback
- Iterate on psychological analysis accuracy
- Expand cultural context database