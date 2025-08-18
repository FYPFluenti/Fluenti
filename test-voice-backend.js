import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

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
      console.log('ℹ️  User might already exist, trying to login...');
      // Try login instead
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'voicetest@example.com',
          password: 'testpassword123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        userId = loginData.user?.id || loginData.id;
        console.log('✅ User logged in with ID:', userId);
      } else {
        console.log('❌ Failed to create or login user');
        return;
      }
    }
    
    // Step 2: Test voice endpoint with audio file
    console.log('\nStep 2: Testing voice endpoint...');
    const audioPath = path.join(process.cwd(), 'server', 'test-audio', 'english_test.wav');
    
    if (!fs.existsSync(audioPath)) {
      console.log('❌ Audio file not found at:', audioPath);
      return;
    }
    
    const formData = new FormData();
    formData.append('mode', 'voice');
    formData.append('language', 'en');
    formData.append('audio', fs.createReadStream(audioPath), 'voice.wav');
    formData.append('history', JSON.stringify([]));
    
    const voiceResponse = await fetch('http://localhost:3001/api/emotional-support', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Response status:', voiceResponse.status);
    
    if (voiceResponse.ok) {
      const voiceData = await voiceResponse.json();
      console.log('\n🎉 Voice Integration Test Results:');
      console.log('📝 Transcription:', voiceData.transcription || 'N/A');
      console.log('😊 Detected Emotion:', voiceData.emotion || 'N/A');
      console.log('💬 AI Response:', voiceData.response?.substring(0, 100) + '...' || 'N/A');
      console.log('\n✅ Voice integration working successfully!');
    } else {
      const errorText = await voiceResponse.text();
      console.log('❌ Voice endpoint error:', voiceResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testVoiceEndpoint();
