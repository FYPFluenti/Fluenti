// Test script for enhanced emotion detection with context extraction
import { detectEmotionFromText } from './server/services/emotionService';

async function testEnhancedEmotionDetection() {
  console.log('=== Testing Enhanced Emotion Detection with Context Extraction ===\n');
  
  const testTexts = [
    "I'm feeling really stressed about my upcoming exams and job interviews",
    "I love spending time with my family during holidays, it makes me so happy",
    "The terrible weather and traffic jam made me angry and frustrated",
    "I'm scared about the medical test results coming tomorrow",
    "This movie was absolutely disgusting and horrible",
    "I was surprised to see my old friend at the coffee shop"
  ];

  for (const text of testTexts) {
    try {
      console.log(`\nTesting: "${text}"`);
      console.log('---'.repeat(20));
      
      const result = await detectEmotionFromText(text, 'en');
      
      console.log(`Emotion: ${result.emotion}`);
      console.log(`Confidence: ${result.confidence.toFixed(3)}`);
      console.log(`Context: [${result.context?.join(', ') || 'No context'}]`);
      console.log(`Error: ${result.error || 'None'}`);
      
    } catch (error) {
      console.error(`Error testing "${text}":`, error);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testEnhancedEmotionDetection().catch(console.error);
