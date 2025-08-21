// Test the chat mode with context extraction
const testMessage = "I'm feeling really stressed about my upcoming exams and job interviews";

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
  console.log('✅ Chat Mode Test Result:');
  console.log('📝 Message:', testMessage);
  console.log('🎭 Emotion:', data.emotion?.emotion || 'unknown');
  console.log('📊 Confidence:', data.emotion?.confidence || 'unknown');
  console.log('🏷️  Context:', data.emotion?.context || 'No context available');
  console.log('🔧 Method:', data.emotion?.method || 'unknown');
  console.log('💬 Response preview:', data.response?.substring(0, 100) + '...');
})
.catch(error => console.error('❌ Test failed:', error));
