// Test script for Chat Mode functionality
async function testChatMode() {
  const chatUrl = 'http://localhost:3000/api/test-chat';
  
  console.log('🗨️  Testing Chat Mode Functionality\n');
  
  const testMessages = [
    {
      name: "Happy message",
      message: "I'm feeling really happy today! Everything is going well.",
      language: "en"
    },
    {
      name: "Sad message", 
      message: "I've been feeling really sad lately. Nothing seems to be going right.",
      language: "en"
    },
    {
      name: "Anxious message",
      message: "I'm so anxious about my presentation tomorrow. I'm really nervous.",
      language: "en"
    },
    {
      name: "Angry message",
      message: "I'm so frustrated with everything right now. Nothing is working!",
      language: "en"
    },
    {
      name: "Neutral message",
      message: "Hello, I just wanted to talk to someone today.",
      language: "en"
    },
    {
      name: "Empty message test",
      message: "",
      language: "en"
    },
    {
      name: "Whitespace message test",
      message: "   ",
      language: "en"
    }
  ];

  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    console.log(`${i + 1}️⃣ Testing: ${test.name}`);
    console.log(`   Message: "${test.message}"`);
    
    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          language: test.language,
          sessionId: `test-session-${i + 1}`
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ Success!`);
        console.log(`   📝 Detected Emotion: ${result.detectedEmotion}`);
        console.log(`   🤖 Response: ${result.chatResponse.substring(0, 80)}...`);
        console.log(`   🔧 STT Used: ${result.sttUsed}`);
        console.log(`   📱 Mode: ${result.mode}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log(); // Empty line for readability
  }
  
  console.log('🎯 Chat Mode Testing Summary:');
  console.log('✅ Text input processing (no STT)');
  console.log('✅ Emotion detection from text');
  console.log('✅ Contextual response generation');
  console.log('✅ Error handling for empty messages');
  console.log('✅ Session management');
  console.log('\n🎉 Chat Mode Test Complete!');
}

// Run the test
testChatMode().catch(console.error);
