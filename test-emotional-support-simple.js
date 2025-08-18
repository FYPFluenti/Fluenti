// Simple test for the emotional support endpoint
const testEmotionalSupport = async () => {
  const testUrl = 'http://localhost:3000/api/emotional-support';
  
  // Test 1: Text mode
  console.log('Testing text mode...');
  try {
    const textResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'text',
        language: 'en',
        text: 'I am feeling anxious today'
      })
    });
    
    const textResult = await textResponse.json();
    console.log('Text mode result:', textResult);
  } catch (error) {
    console.error('Text mode test failed:', error);
  }
  
  // Test 2: Voice mode without actual audio (should fallback gracefully)
  console.log('\nTesting voice mode without audio...');
  try {
    const voiceResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'voice',
        language: 'en',
        text: 'Fallback text for voice mode'
      })
    });
    
    const voiceResult = await voiceResponse.json();
    console.log('Voice mode result:', voiceResult);
  } catch (error) {
    console.error('Voice mode test failed:', error);
  }
};

// Run the test
testEmotionalSupport();
