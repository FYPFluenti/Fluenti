const axios = require('axios');

// Test the superior therapeutic endpoint
async function testSuperiorTherapeutic() {
    try {
        console.log('🧠 Testing Superior Therapeutic Model Integration...\n');
        
        // Test message simulating someone feeling anxious
        const testMessage = "I've been feeling really overwhelmed lately with work and personal stress. I can't seem to find a way to cope and everything feels like too much.";
        const testEmotions = ['anxiety', 'stress'];
        const testContext = [
            "I've been working long hours",
            "My personal relationships are suffering"
        ];
        
        console.log('📝 Test Input:');
        console.log('Message:', testMessage);
        console.log('Emotions:', testEmotions);
        console.log('Context:', testContext);
        console.log('');
        
        // Make request to the superior therapeutic endpoint
        const response = await axios.post('http://localhost:3000/api/chat/therapeutic-superior', {
            sessionId: 'test-session-' + Date.now(),
            message: testMessage,
            emotions: testEmotions,
            context: testContext,
            language: 'en',
            sessionContext: {
                sessionId: 'test-session',
                mode: 'text',
                sessionStart: Date.now()
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Simple test token
            },
            timeout: 120000 // 2 minute timeout for model loading
        });
        
        console.log('✅ Superior Therapeutic Response Generated!');
        console.log('');
        console.log('🎯 Response:', response.data.response);
        console.log('');
        console.log('📊 Quality Metrics:');
        console.log('- Overall Quality:', response.data.quality_metrics.overall_quality);
        console.log('- Confidence:', response.data.quality_metrics.confidence);
        console.log('- Empathy Score:', response.data.quality_metrics.empathy_score);
        console.log('- Therapeutic Level:', response.data.quality_metrics.therapeutic_level);
        console.log('- Emotion Alignment:', response.data.quality_metrics.emotion_alignment);
        console.log('- Context Relevance:', response.data.quality_metrics.context_relevance);
        console.log('');
        console.log('🤖 Model Info:');
        console.log('- Model Used:', response.data.model_info.model_used);
        console.log('- Fallback Used:', response.data.model_info.fallback_used);
        console.log('- Timestamp:', response.data.model_info.timestamp);
        console.log('');
        
        if (response.data.session_insights) {
            console.log('🔍 Session Insights:');
            console.log(JSON.stringify(response.data.session_insights, null, 2));
        }
        
        console.log('');
        console.log('🎉 Superior Therapeutic Model Integration Test PASSED!');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        
        if (error.response?.data) {
            console.log('📊 Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        
        console.log('');
        console.log('🔧 This might be expected if:');
        console.log('- The therapeutic model is still loading (first time)');
        console.log('- GPU memory is insufficient');
        console.log('- Authentication is required');
        console.log('- Python dependencies are missing');
    }
}

// Run the test
testSuperiorTherapeutic();
