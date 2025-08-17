// Test emotion detection fix
const { detectEmotion } = require('./server/services/speechService.ts');

async function testEmotionDetection() {
  console.log('Testing Emotion Detection Fix...\n');
  
  const testCases = [
    { text: "i am not feeling so well lately", expected: "sad" },
    { text: "i dont feel good", expected: "sad" },
    { text: "I don't feel good today", expected: "sad" },
    { text: "not feeling well", expected: "sad" },
    { text: "feeling bad", expected: "sad" },
    { text: "I am happy today", expected: "happy" },
    { text: "feeling great", expected: "happy" },
    { text: "I am worried about work", expected: "anxious" },
    { text: "feeling stressed", expected: "anxious" }
  ];
  
  for (const testCase of testCases) {
    try {
      const result = await detectEmotion(testCase.text);
      const status = result.emotion === testCase.expected ? '✅' : '❌';
      console.log(`${status} "${testCase.text}" -> ${result.emotion} (${result.score}) [expected: ${testCase.expected}]`);
    } catch (error) {
      console.log(`❌ "${testCase.text}" -> ERROR: ${error.message}`);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testEmotionDetection();
}

module.exports = { testEmotionDetection };
