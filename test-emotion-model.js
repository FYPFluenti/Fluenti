// Focused test on the working HuggingFace emotion model
import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';

config();

async function testWorkingEmotionModel() {
    console.log('🎯 Testing Working HuggingFace Emotion Model');
    console.log('='.repeat(50));
    
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    const emotionTests = [
        'I am very happy today',
        'I feel anxious about my presentation',
        'I am so angry at this situation',
        'I feel sad and lonely',
        'I am scared of the dark',
        'This is amazing, I love it!',
        'میں بہت خوش ہوں', // Urdu: I am very happy
        'مجھے پریشانی ہو رہی ہے' // Urdu: I am worried
    ];
    
    for (const text of emotionTests) {
        try {
            console.log(`\n🧪 Testing: "${text}"`);
            
            const result = await hf.textClassification({
                model: 'j-hartmann/emotion-english-distilroberta-base',
                inputs: text
            });
            
            const topEmotion = result[0];
            console.log(`✅ Detected: ${topEmotion.label} (${(topEmotion.score * 100).toFixed(1)}%)`);
            
            // Show top 3 emotions
            console.log('   Top emotions:');
            result.slice(0, 3).forEach((emotion, index) => {
                console.log(`   ${index + 1}. ${emotion.label}: ${(emotion.score * 100).toFixed(1)}%`);
            });
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

testWorkingEmotionModel().catch(console.error);
