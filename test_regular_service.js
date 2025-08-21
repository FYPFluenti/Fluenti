// Quick test for regular emotion service with context
const testMessage = "just had to watch that disgusting movie";

fetch('http://localhost:3000/api/test-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: testMessage,
    sessionId: 'test-context-' + Date.now(),
    language: 'en'
  })
})
.then(response => response.json())
.then(data => {
  console.log('🧪 Test Result:', data);
  console.log('📝 Message:', testMessage);
  if (data.emotion) {
    console.log('✅ Emotion:', data.emotion.emotion);
    console.log('📊 Confidence:', data.emotion.confidence);
    console.log('🏷️  Context:', data.emotion.context || 'No context');
  }
})
.catch(error => console.error('❌ Test failed:', error));
