#!/usr/bin/env node

// Simple test for the updated chat endpoint
async function testChatEndpoint() {
    try {
        console.log('🧪 Testing Updated Chat Endpoint...\n');
        
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
                sessionId: 'test-session-' + Date.now(),
                language: 'en'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
        }
        
        console.log('✅ Response Generated!');
        console.log('');
        console.log('📊 Response Data:');
        console.log(JSON.stringify(data, null, 2));
        
        // Check if it's using the therapeutic model
        if (data.therapeuticResult) {
            console.log('');
            console.log('🎉 SUCCESS: Using Superior Therapeutic Model!');
            console.log('🎯 Therapeutic Response:', data.therapeuticResult.response);
            console.log('📊 Quality:', data.therapeuticResult.quality);
            console.log('❤️ Empathy Score:', data.therapeuticResult.empathy_score);
        } else {
            console.log('');
            console.log('⚠️ NOTICE: Using fallback response (not therapeutic model)');
            console.log('💬 Fallback Response:', data.response || data.message);
        }
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testChatEndpoint();
