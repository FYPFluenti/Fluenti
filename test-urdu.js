console.log('Testing Urdu text encoding:');

const urduText = "میں بہت پریشان اور اداس ہوں";
console.log('Original Urdu text:', urduText);
console.log('Text length:', urduText.length);
console.log('Character codes:', [...urduText].map(c => c.charCodeAt(0)));

// Test the keyword detection function
function testKeywordDetection(text) {
  console.log('\n--- Testing keyword detection ---');
  console.log('Input text:', text);
  console.log('Text length:', text.length);
  
  const lowerText = text.toLowerCase();
  console.log('Lowercase text:', lowerText);
  
  // Check if text contains Urdu characters
  const hasUrdu = /[\u0600-\u06FF\u0750-\u077F]/.test(text);
  console.log('Has Urdu characters:', hasUrdu);
  
  // Test individual keywords
  console.log('Contains پریشان:', text.includes('پریشان'));
  console.log('Contains اداس:', text.includes('اداس'));
  console.log('Contains فکر:', text.includes('فکر'));
  
  return { hasUrdu, containsPareshan: text.includes('پریشان'), containsUdas: text.includes('اداس') };
}

const result = testKeywordDetection(urduText);
console.log('Test result:', result);
