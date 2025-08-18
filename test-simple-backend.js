const fs = require('fs');
const path = require('path');

async function testVoiceEndpoint() {
  try {
    console.log('🚀 Testing Voice Integration...\n');
    
    // Step 1: Create a test user
    console.log('Step 1: Creating test user...');
    const createUserResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Voice',
        lastName: 'Test',
        email: 'voicetest@example.com',
        password: 'testpassword123',
        userType: 'student'
      })
    });
    
    let userId = null;
    if (createUserResponse.ok) {
      const userData = await createUserResponse.json();
      userId = userData.user?.id || userData.id;
      console.log('✅ User created with ID:', userId);
    } else {
      console.log('ℹ️  User might already exist, trying different approach...');
      // For testing, let's use a simple user ID
      userId = 'test-user-id';
    }
    
    // Step 2: Test voice endpoint with text fallback first
    console.log('\nStep 2: Testing voice endpoint with text...');
    
    const testResponse = await fetch('http://localhost:3001/api/emotional-support', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "I'm feeling anxious about my upcoming test",
        mode: 'text',
        language: 'en'
      })
    });
    
    console.log('Response status:', testResponse.status);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('\n🎉 Text Integration Test Results:');
      console.log('📝 Input:', "I'm feeling anxious about my upcoming test");
      console.log('😊 Detected Emotion:', data.emotion || 'N/A');
      console.log('💬 AI Response:', data.response?.substring(0, 100) + '...' || 'N/A');
      console.log('\n✅ Basic endpoint working successfully!');
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Endpoint error:', testResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testVoiceEndpoint();
