// Comprehensive HuggingFace Inference Provider Test
// Tests multiple models and providers to diagnose availability issues

import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';

config();

async function testInferenceProviders() {
    console.log('🤗 HuggingFace Inference Provider Comprehensive Test');
    console.log('='.repeat(60));
    
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
        console.error('❌ HUGGINGFACE_API_KEY not found');
        return;
    }
    
    console.log(`✅ Token: ${apiKey.substring(0,6)}...${apiKey.substring(apiKey.length-4)} (${apiKey.length} chars)`);
    console.log(`✅ Token format: ${apiKey.startsWith('hf_') ? 'Valid' : 'Invalid'}\n`);
    
    const hf = new HfInference(apiKey);
    
    // Test different model categories and providers
    const testCases = [
        {
            name: 'Text Classification (Light)',
            test: async () => {
                return await hf.textClassification({
                    model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
                    inputs: 'I am happy'
                });
            }
        },
        {
            name: 'Emotion Classification (FLUENTI)',
            test: async () => {
                return await hf.textClassification({
                    model: 'j-hartmann/emotion-english-distilroberta-base',
                    inputs: 'I feel anxious'
                });
            }
        },
        {
            name: 'Text Generation (GPT-2)',
            test: async () => {
                return await hf.textGeneration({
                    model: 'gpt2',
                    inputs: 'Hello',
                    parameters: { max_new_tokens: 5 }
                });
            }
        },
        {
            name: 'Speech Recognition (Whisper Tiny)',
            test: async () => {
                // Create minimal audio blob for testing
                const silentAudio = new Uint8Array(1024).fill(0);
                const audioBlob = new Blob([silentAudio], { type: 'audio/wav' });
                
                return await hf.automaticSpeechRecognition({
                    model: 'openai/whisper-tiny',
                    data: audioBlob
                });
            }
        },
        {
            name: 'Speech Recognition (Whisper Base)',
            test: async () => {
                const silentAudio = new Uint8Array(1024).fill(0);
                const audioBlob = new Blob([silentAudio], { type: 'audio/wav' });
                
                return await hf.automaticSpeechRecognition({
                    model: 'openai/whisper-base',
                    data: audioBlob
                });
            }
        },
        {
            name: 'Alternative STT Model',
            test: async () => {
                const silentAudio = new Uint8Array(1024).fill(0);
                const audioBlob = new Blob([silentAudio], { type: 'audio/wav' });
                
                return await hf.automaticSpeechRecognition({
                    model: 'facebook/wav2vec2-large-960h-lv60-self',
                    data: audioBlob
                });
            }
        }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testCase.test();
            const duration = Date.now() - startTime;
            
            console.log(`✅ SUCCESS (${duration}ms)`);
            
            if (testCase.name.includes('Classification')) {
                const topResult = Array.isArray(result) ? result[0] : result;
                console.log(`   Result: ${topResult.label} (${(topResult.score * 100).toFixed(1)}%)`);
            } else if (testCase.name.includes('Generation')) {
                console.log(`   Generated: "${result.generated_text?.substring(0, 50)}..."`);
            } else if (testCase.name.includes('Speech')) {
                console.log(`   Transcription: "${result.text || 'No speech detected'}"`);
            }
            
            results.push({ name: testCase.name, status: 'SUCCESS', duration });
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
            
            // Analyze error types
            if (error.message.includes('No Inference Provider')) {
                console.log(`   → Provider unavailable (temporary server issue)`);
            } else if (error.message.includes('rate limit')) {
                console.log(`   → Rate limit reached`);
            } else if (error.message.includes('401')) {
                console.log(`   → Authentication issue`);
            } else if (error.message.includes('timeout')) {
                console.log(`   → Request timeout`);
            } else {
                console.log(`   → Other error: ${error.message.substring(0, 100)}`);
            }
            
            results.push({ name: testCase.name, status: 'FAILED', error: error.message });
        }
        
        console.log(''); // Empty line for readability
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('📊 Test Results Summary:');
    console.log('='.repeat(40));
    
    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status === 'FAILED');
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n✅ Working Models:');
        successful.forEach(r => {
            console.log(`   • ${r.name} (${r.duration}ms)`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed Models:');
        failed.forEach(r => {
            console.log(`   • ${r.name}: ${r.error.substring(0, 60)}...`);
        });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (successful.length === 0) {
        console.log('   → All models failed - check token validity or try later');
        console.log('   → HuggingFace servers may be experiencing issues');
    } else if (failed.some(r => r.name.includes('Speech'))) {
        console.log('   → STT models may be unavailable - use text input as fallback');
        console.log('   → Consider local STT solutions for production');
    } else {
        console.log('   → Some models working - inference providers are partially available');
    }
    
    // Test FLUENTI integration
    console.log('\n🚀 Testing FLUENTI Integration:');
    try {
        const response = await fetch('http://localhost:3000/api/test-emotional-support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'I am testing the system', language: 'en' })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ FLUENTI API: Working perfectly');
            console.log(`   Emotion detected: ${result.emotion.emotion} (${(result.emotion.score * 100).toFixed(1)}%)`);
        } else {
            console.log(`❌ FLUENTI API: HTTP ${response.status}`);
        }
    } catch (error) {
        console.log(`⚠️ FLUENTI API: ${error.message}`);
    }
}

// Run the comprehensive test
testInferenceProviders().catch(console.error);
