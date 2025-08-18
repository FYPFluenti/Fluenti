// Simple chat mode test
const testChatEndpoint = async () => {
  const testCases = [
    {
      name: "Happy Test",
      message: "I'm feeling really happy today!",
      expectedEmotion: "happy"
    },
    {
      name: "Sad Test", 
      message: "I'm feeling sad and upset",
      expectedEmotion: "sad"
    },
    {
      name: "Anxious Test",
      message: "I'm so anxious about tomorrow",
      expectedEmotion: "anxious"
    },
    {
      name: "Angry Test",
      message: "I'm really angry and frustrated",
      expectedEmotion: "angry"
    },
    {
      name: "Neutral Test",
      message: "Hello, how are you?",
      expectedEmotion: "neutral"
    }
  ];

  console.log("🗨️ Chat Mode Test Results:");
  console.log("==========================\n");

  for (const test of testCases) {
    console.log(`Testing: ${test.name}`);
    console.log(`Message: "${test.message}"`);
    console.log(`Expected: ${test.expectedEmotion}`);
    console.log("---");
  }
  
  console.log("\n✅ All tests defined successfully!");
  console.log("📝 Use PowerShell commands to test each scenario:");
  console.log("\nExample commands:");
  
  testCases.forEach((test, index) => {
    const body = JSON.stringify({
      message: test.message,
      language: "en",
      sessionId: `test-${index + 1}`
    }).replace(/"/g, '\\"');
    
    console.log(`\n${index + 1}. ${test.name}:`);
    console.log(`Invoke-RestMethod -Uri "http://localhost:3000/api/test-chat" -Method POST -ContentType "application/json" -Body '${body.replace(/\\"/g, '"')}'`);
  });
};

testChatEndpoint();
