// Simple HuggingFace Token Test - Using Available Models
import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';

config();

async function testWithAvailableModel() {
    console.log('🧪 Testing HF Token with Lightweight Model...');
    
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    try {
        // Test with a simple, usually available model
        const result = await hf.textGeneration({
            model: 'gpt2',
            inputs: 'Hello',
            parameters: { max_new_tokens: 1 }
        });
        
        console.log('✅ HuggingFace Token: WORKING');
        console.log(`✅ Text generation result: "${result.generated_text}"`);
        return true;
        
    } catch (error) {
        console.log('⚠️  First model failed, trying emotion classification...');
        
        try {
            // Try emotion classification (what your app actually uses)
            const result = await hf.textClassification({
                model: 'j-hartmann/emotion-english-distilroberta-base',
                inputs: 'I am happy'
            });
            
            console.log('✅ HuggingFace Token: WORKING (Emotion Classification)');
            console.log(`✅ Emotion: ${result[0].label} (${(result[0].score * 100).toFixed(1)}%)`);
            return true;
            
        } catch (error2) {
            console.log('❌ Both tests failed:', error2.message);
            return false;
        }
    }
}

testWithAvailableModel();
