// Test script for OpenAI Assessment System
// Run with: node test-assessment.js

const { OpenAIAssessmentService } = require('../server/services/openaiAssessment');

async function testAssessment() {
  console.log('🧪 Testing OpenAI Assessment System\n');

  // Test data
  const testData = {
    categoryName: 'HEARING',
    responses: [
      { question: 'Does your child respond when you call their name?', answer: 'yes' },
      { question: 'Can your child hear quiet sounds like whispering?', answer: 'no' },
      { question: 'Does your child seem to enjoy music and sounds?', answer: 'yes' }
    ],
    childAge: { years: 3, months: 6 },
    childName: 'Test Child'
  };

  try {
    // Test service availability
    console.log('1. Checking service availability...');
    const isAvailable = OpenAIAssessmentService.isAvailable();
    console.log(`   Service available: ${isAvailable ? '✅' : '❌'}`);
    
    if (!isAvailable) {
      console.log('   Make sure OPENAI_API_KEY is set in .env file');
      return;
    }

    // Test category analysis
    console.log('\n2. Testing category analysis...');
    const analysis = await OpenAIAssessmentService.analyzeCategoryWithAI(
      testData.categoryName,
      testData.responses,
      testData.childAge,
      testData.childName
    );

    console.log('   ✅ Category analysis successful!');
    console.log(`   Risk Level: ${analysis.riskLevel}`);
    console.log(`   Concerning Answers: ${analysis.concerningAnswers}`);
    console.log(`   Milestone Alignment: ${analysis.milestoneAlignment}%`);
    console.log(`   Recommendations: ${analysis.recommendations.length} items`);

    // Test overall assessment
    console.log('\n3. Testing overall assessment...');
    const overallAssessment = await OpenAIAssessmentService.generateOverallAssessment(
      [analysis],
      testData.childAge,
      testData.childName,
      testData.responses.length
    );

    console.log('   ✅ Overall assessment successful!');
    console.log(`   Overall Risk: ${overallAssessment.overallRiskLevel}`);
    console.log(`   Summary: ${overallAssessment.summary.substring(0, 100)}...`);
    console.log(`   Next Steps: ${overallAssessment.nextSteps.length} items`);

    console.log('\n🎉 All tests passed! OpenAI Assessment System is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Full error:', error);
  }
}

// Run the test
testAssessment();