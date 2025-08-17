import fetch from 'node-fetch';

async function testPhase4() {
  console.log('🧪 Testing Enhanced Phase 4 Implementation...\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "I'm feeling really sad today",
        emotion: "sadness"
      })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Phase 4 Response:', data);
    } catch (parseError) {
      console.log('Not valid JSON, raw text response received');
    }
    
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhase4();
