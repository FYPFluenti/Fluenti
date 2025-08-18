// Test script for the fixed emotional support endpoint
async function testFixedEndpoint() {
  const testUrl = 'http://localhost:3000/api/emotional-support';
  
  console.log('🧪 Testing Fixed Emotional Support Endpoint\n');
  
  // Test 1: Text mode
  console.log('1️⃣ Testing text mode...');
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'text',
        language: 'en',
        text: 'I am feeling stressed about work today'
      })
    });
    
    const result = await response.json();
    console.log('✅ Text mode success:', result);
    console.log();
  } catch (error) {
    console.error('❌ Text mode failed:', error.message);
  }
  
  // Test 2: Voice mode (without audio - should use fallback text)
  console.log('2️⃣ Testing voice mode (fallback)...');
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'voice',
        language: 'en',
        text: 'This is fallback text for voice mode'
      })
    });
    
    const result = await response.json();
    console.log('✅ Voice mode success:', result);
    console.log();
  } catch (error) {
    console.error('❌ Voice mode failed:', error.message);
  }
  
  console.log('🎉 Testing complete!');
}

// Run the test
testFixedEndpoint().catch(console.error);
