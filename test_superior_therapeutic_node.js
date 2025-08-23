#!/usr/bin/env node

// Simple test using built-in fetch (Node.js 18+)
async function testSuperiorTherapeutic() {
    try {
        console.log('🧠 Testing Superior Therapeutic Model Integration...\n');
        
        const testMessage = "I've been feeling really overwhelmed lately with work and personal stress. I can't seem to find a way to cope and everything feels like too much.";
        const testEmotions = ['anxiety', 'stress'];
        const testContext = ["I've been working long hours", "My personal relationships are suffering"];
        
        console.log('📝 Test Input:');
        console.log('Message:', testMessage);
        console.log('Emotions:', testEmotions);
        console.log('Context:', testContext);
        console.log('');
        
        const response = await fetch('http://localhost:3000/api/test-superior-therapeutic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // No auth required for test endpoint
            },
            body: JSON.stringify({
                message: testMessage,
                emotions: testEmotions,
                context: testContext,
                language: 'en',
                sessionContext: {
                    sessionId: 'test-session',
                    mode: 'text',
                    sessionStart: Date.now()
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
        }
        
        console.log('✅ Superior Therapeutic Response Generated!');
        console.log('');
        console.log('🎯 Response:', data.response);
        console.log('');
        console.log('📊 Quality Metrics:');
        console.log('- Overall Quality:', data.quality_metrics?.overall_quality);
        console.log('- Confidence:', data.quality_metrics?.confidence);
        console.log('- Empathy Score:', data.quality_metrics?.empathy_score);
        console.log('- Therapeutic Level:', data.quality_metrics?.therapeutic_level);
        console.log('- Emotion Alignment:', data.quality_metrics?.emotion_alignment);
        console.log('- Context Relevance:', data.quality_metrics?.context_relevance);
        console.log('');
        console.log('🤖 Model Info:');
        console.log('- Model Used:', data.model_info?.model_used);
        console.log('- Fallback Used:', data.model_info?.fallback_used);
        console.log('- Timestamp:', data.model_info?.timestamp);
        console.log('');
        
        if (data.session_insights) {
            console.log('🔍 Session Insights:');
            console.log(JSON.stringify(data.session_insights, null, 2));
        }
        
        console.log('');
        console.log('🎉 Superior Therapeutic Model Integration Test PASSED!');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        
        console.log('');
        console.log('🔧 This might be expected if:');
        console.log('- The therapeutic model is still loading (first time)');
        console.log('- GPU memory is insufficient');
        console.log('- Authentication is required');
        console.log('- Python dependencies are missing');
    }
}

testSuperiorTherapeutic();
