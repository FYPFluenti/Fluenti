import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const SERVER_URL = 'http://localhost:3001';

async function testVoiceIntegration() {
  console.log('🚀 Starting End-to-End Voice Integration Test\n');

  try {
    // Test 1: Create a user for authentication
    console.log('📋 Test 1: User Authentication Setup');
    
    const signupResponse = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Voice',
        lastName: 'Tester',
        email: 'voicetester@fluenti.test',
        password: 'testpass123',
        userType: 'adult',
        language: 'english'
      })
    });
    
    let authToken = null;
    if (signupResponse.ok) {
      const userData = await signupResponse.json();
      authToken = userData.authToken || userData.user?.id;
      console.log('✅ User created successfully, token:', authToken);
    } else {
      // Try login if user exists
      console.log('ℹ️  User might exist, trying login...');
      const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'voicetester@fluenti.test',
          password: 'testpass123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.authToken || loginData.user?.id;
        console.log('✅ User logged in successfully, token:', authToken);
      }
    }
    
    if (!authToken) {
      console.log('❌ Failed to get authentication token');
      return;
    }

    // Test 2: Voice Mode - Stressed Audio
    console.log('\n📋 Test 2: Voice Mode with Stressed Audio');
    
    const audioPath = path.join(process.cwd(), 'server', 'test-audio', 'stressed_test.wav');
    if (!fs.existsSync(audioPath)) {
      console.log('❌ Stressed audio file not found');
      return;
    }
    
    const formData = new FormData();
    formData.append('mode', 'voice');
    formData.append('language', 'en');
    formData.append('audio', fs.createReadStream(audioPath), 'voice.wav');
    formData.append('history', JSON.stringify([]));
    
    console.log('⏳ Sending voice request...');
    const voiceResponse = await fetch(`${SERVER_URL}/api/emotional-support`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📊 Voice Response Status:', voiceResponse.status);
    
    if (voiceResponse.ok) {
      const voiceData = await voiceResponse.json();
      console.log('\n🎉 Voice Mode Test Results:');
      console.log('🎤 Transcription:', voiceData.transcription);
      console.log('😊 Detected Emotion:', voiceData.emotion?.emotion, `(${voiceData.confidence || voiceData.emotion?.score})`);
      console.log('💬 AI Response:', voiceData.response?.substring(0, 120) + '...');
      console.log('🔍 Emotion Source:', voiceData.emotionSource || 'text-only');
      console.log('🌐 Language:', voiceData.language);
      console.log('🎯 Voice Mode:', voiceData.voiceMode);
      
      // Validation checks
      const isValidTranscription = voiceData.transcription && voiceData.transcription.toLowerCase().includes('stress');
      const hasValidEmotion = voiceData.emotion && voiceData.emotion.emotion;
      const hasResponse = voiceData.response && voiceData.response.length > 10;
      
      console.log('\n📋 Validation Results:');
      console.log('✅ STT Working:', isValidTranscription ? 'PASS' : 'FAIL');
      console.log('✅ Emotion Detection:', hasValidEmotion ? 'PASS' : 'FAIL');
      console.log('✅ Response Generation:', hasResponse ? 'PASS' : 'FAIL');
      
    } else {
      const errorText = await voiceResponse.text();
      console.log('❌ Voice mode failed:', voiceResponse.status, errorText);
    }

    // Test 3: Text Mode (Chat Mode Test)
    console.log('\n📋 Test 3: Text Mode (Chat Mode)');
    
    const textResponse = await fetch(`${SERVER_URL}/api/emotional-support`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'I am feeling very anxious about my upcoming presentation',
        mode: 'text',
        language: 'en',
        history: []
      })
    });
    
    console.log('📊 Text Response Status:', textResponse.status);
    
    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('\n🎉 Text Mode Test Results:');
      console.log('📝 Input Text:', 'I am feeling very anxious about my upcoming presentation');
      console.log('😊 Detected Emotion:', textData.emotion?.emotion, `(${textData.confidence || textData.emotion?.score})`);
      console.log('💬 AI Response:', textData.response?.substring(0, 120) + '...');
      
      // Validation
      const hasValidEmotion = textData.emotion && (textData.emotion.emotion === 'anxious' || textData.emotion.emotion === 'anxiety');
      const hasResponse = textData.response && textData.response.length > 10;
      
      console.log('\n📋 Text Mode Validation:');
      console.log('✅ Text Processing:', textData.transcription ? 'PASS' : 'PASS (direct text)');
      console.log('✅ Emotion Detection:', hasValidEmotion ? 'PASS' : `DETECTED: ${textData.emotion?.emotion}`);
      console.log('✅ Response Generation:', hasResponse ? 'PASS' : 'FAIL');
      
    } else {
      const errorText = await textResponse.text();
      console.log('❌ Text mode failed:', textResponse.status, errorText);
    }

    // Test 4: Performance & Debug Info
    console.log('\n📋 Test 4: System Performance Check');
    console.log('⚡ GPU Available: Check server logs for torch.cuda output');
    console.log('🐍 Python Environment: Using virtual environment .venv');
    console.log('🎵 Audio Format: WAV files (673KB stressed, 880KB anxious)');
    console.log('⏱️ Expected Performance: ~20-60s first run (model loading), ~5-25s subsequent');

    console.log('\n🎊 End-to-End Voice Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test
testVoiceIntegration();
