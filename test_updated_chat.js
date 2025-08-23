#!/usr/bin/env node

// Test the updated /api/test-chat endpoint with superior therapeutic model
async function testUpdatedChatEndpoint() {
    try {
        console.log('🧠 Testing Updated /api/test-chat with Superior Therapeutic Model...\n');
        
        const testMessage = "i feel anxious lately";
        
        console.log('📝 Test Input:');
        console.log('Message:', testMessage);
        console.log('');
        
        const response = await fetch('http://localhost:3000/api/test-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: testMessage,
                sessionId: 'support-session-' + Date.now(),
                language: 'en'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
        }
        
        console.log('✅ Response Generated Successfully!');
        console.log('');
        console.log('🎯 Chat Response:', data.chatResponse);
        console.log('');
        console.log('😊 Detected Emotion:', data.detectedEmotion, `(${data.confidence.toFixed(3)})`);
        console.log('🔧 Emotion Method:', data.emotionMethod);
        console.log('🚀 Mode:', data.mode);
        console.log('');
        
        if (data.quality_metrics) {
            console.log('📊 Quality Metrics:');
            console.log('- Overall Quality:', data.quality_metrics.overall_quality);
            console.log('- Confidence:', data.quality_metrics.confidence);
            console.log('- Empathy Score:', data.quality_metrics.empathy_score);
            console.log('- Therapeutic Level:', data.quality_metrics.therapeutic_level);
            console.log('- Emotion Alignment:', data.quality_metrics.emotion_alignment);
            console.log('- Context Relevance:', data.quality_metrics.context_relevance);
            console.log('');
        }
        
        if (data.model_info) {
            console.log('🤖 Model Info:');
            console.log('- Model Used:', data.model_info.model_used);
            console.log('- Fallback Used:', data.model_info.fallback_used);
            console.log('- Timestamp:', data.model_info.timestamp);
            console.log('');
        }
        
        if (data.session_insights) {
            console.log('🔍 Session Insights:');
            console.log(JSON.stringify(data.session_insights, null, 2));
        }
        
        console.log('');
        
        if (data.quality_metrics && data.quality_metrics.overall_quality > 0.8) {
            console.log('🎉 Superior Therapeutic Model Integration in /api/test-chat SUCCESSFUL!');
        } else if (data.model_info && data.model_info.model_used === 'basic-fallback') {
            console.log('⚠️  Using fallback responses - Superior model may need loading time');
        } else {
            console.log('✅ Test completed - check quality metrics above');
        }
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        
        console.log('');
        console.log('🔧 This might be expected if:');
        console.log('- The server is not running');
        console.log('- The therapeutic model is still loading');
        console.log('- There are configuration issues');
    }
}

testUpdatedChatEndpoint();
