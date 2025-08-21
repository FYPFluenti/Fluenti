// Test the updated emotion detection with context extraction
import { detectEmotionFromText } from './server/services/emotionServiceOptimized';

async function testContextExtraction() {
  console.log('=== Testing Phase 4 Emotion Detection with Context ===\n');
  
  const testMessages = [
    "i just had to watch an horrible and disgusting movie today",
    "I'm really stressed about my job interview tomorrow morning",
    "My family vacation to Paris was absolutely amazing and wonderful",
    "The car accident on the highway made me terrified and scared"
  ];

  for (const message of testMessages) {
    try {
      console.log(`\n🧪 Testing: "${message}"`);
      console.log('─'.repeat(60));
      
      const result = await detectEmotionFromText(message, 'en');
      
      console.log(`✅ Emotion: ${result.emotion}`);
      console.log(`📊 Confidence: ${result.confidence.toFixed(3)}`);
      console.log(`🏷️  Context: [${result.context?.join(', ') || 'No context available'}]`);
      console.log(`🔧 Method: ${result.method || 'Unknown'}`);
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to test "${message}":`, error);
    }
  }
  
  console.log('\n🎉 Context extraction test complete!');
}

// Run the test
testContextExtraction().catch(console.error);
