// Test session continuation
import fetch from 'node-fetch';

async function testSessionContinuation() {
  console.log('🧪 Testing Session Continuation');
  
  // Test with an existing voice session
  const voiceSessionId = 'ykaIjsLLO5Biz63fk5ngK'; // Session 4 from our analysis
  const userId = 'user-imCdZrt0-SiV2ZIeDLJ-h';
  
  console.log(`\n📋 Testing voice session continuation:`);
  console.log(`SessionId: ${voiceSessionId}`);
  console.log(`UserId: ${userId}`);
  
  try {
    // Test the voice endpoint (emotional-support)
    console.log('\n🎤 Testing /api/emotional-support (voice mode)...');
    
    const voiceResponse = await fetch('http://localhost:3000/api/emotional-support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-for-test' // This might need to be a valid token
      },
      body: JSON.stringify({
        text: 'Can you remind me what we were talking about?',
        sessionId: voiceSessionId,
        userId: userId,
        mode: 'voice',
        language: 'en'
      })
    });
    
    if (voiceResponse.ok) {
      const result = await voiceResponse.json();
      console.log('✅ Voice endpoint response:', result.response ? result.response.substring(0, 100) + '...' : 'No response');
    } else {
      console.log('❌ Voice endpoint failed:', voiceResponse.status, voiceResponse.statusText);
      const errorText = await voiceResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
    
    // Test with an existing chat session
    const chatSessionId = 'agvrXhV4WA4cPiAi1dz1H'; // Session 3 from our analysis
    
    console.log('\n💬 Testing /api/emotional-support-chat (chat mode)...');
    console.log(`SessionId: ${chatSessionId}`);
    
    const chatResponse = await fetch('http://localhost:3000/api/emotional-support-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-for-test'
      },
      body: JSON.stringify({
        message: 'Can you remind me what we were discussing about chess?',
        sessionId: chatSessionId,
        userId: userId,
        language: 'en'
      })
    });
    
    if (chatResponse.ok) {
      const result = await chatResponse.json();
      console.log('✅ Chat endpoint response:', result.response ? result.response.substring(0, 100) + '...' : 'No response');
    } else {
      console.log('❌ Chat endpoint failed:', chatResponse.status, chatResponse.statusText);
      const errorText = await chatResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSessionContinuation();