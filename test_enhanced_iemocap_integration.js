// Test enhanced IEMOCAP integration
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const SERVER_URL = 'http://localhost:3000';

async function testEnhancedIEMOCAP() {
    console.log('🎵 Testing Enhanced IEMOCAP Integration...\n');
    
    try {
        // Test 1: Check if we have a test audio file
        const audioFiles = ['temp/audio_1755622224706.wav', 'temp/audio_1755622156245.wav'];
        let testAudio = null;
        
        for (const file of audioFiles) {
            if (fs.existsSync(file)) {
                testAudio = file;
                break;
            }
        }
        
        if (!testAudio) {
            console.log('❌ No test audio files found. Please record some audio first.');
            return;
        }
        
        console.log(`📁 Using test audio: ${testAudio}`);
        
        // Test 2: Send audio to enhanced IEMOCAP endpoint
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(testAudio));
        formData.append('text', 'I feel really stressed about my upcoming presentation');
        formData.append('mode', 'voice');
        formData.append('language', 'en');
        
        console.log('🚀 Sending audio to enhanced emotion detection...');
        
        const response = await fetch(`${SERVER_URL}/api/emotional-support`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        console.log('\n📊 Enhanced IEMOCAP Results:');
        console.log('==========================');
        
        // Check for speech analysis in the new response structure
        if (result.speechAnalysis) {
            console.log(`🎤 Speech Analysis Available: YES`);
            console.log(`📈 Stress Detected: ${result.speechAnalysis.stressDetected ? 'YES' : 'NO'}`);
            console.log(`📈 Anxiety Detected: ${result.speechAnalysis.anxietyDetected ? 'YES' : 'NO'}`);
            console.log(`📈 Tone Analysis: ${result.speechAnalysis.toneAnalysis || 'N/A'}`);
            console.log(`📈 Emotional Intensity: ${result.speechAnalysis.emotionalIntensity?.toFixed(2) || 'N/A'}`);
            
            if (result.speechAnalysis.speechCharacteristics) {
                console.log('\n🔍 Enhanced Speech Characteristics:');
                const chars = result.speechAnalysis.speechCharacteristics;
                console.log(`   • Energy Level: ${chars.energy_level?.toFixed(2) || 'N/A'}`);
                console.log(`   • Pitch Variation: ${chars.pitch_variation?.toFixed(2) || 'N/A'}`);
                console.log(`   • Speech Rate: ${chars.speech_rate?.toFixed(2) || 'N/A'}`);
                console.log(`   • Voice Quality: ${chars.voice_quality?.toFixed(2) || 'N/A'}`);
                console.log(`   • Emotional Intensity: ${chars.emotional_intensity?.toFixed(2) || 'N/A'}`);
                console.log(`   • Stress Indicators: ${chars.stress_indicators?.toFixed(2) || 'N/A'}`);
                console.log(`   • Vocal Tremor: ${chars.vocal_tremor?.toFixed(2) || 'N/A'}`);
                console.log(`   • Breathiness: ${chars.breathiness?.toFixed(2) || 'N/A'}`);
                
                // Check if we have the enhanced characteristics (not the old 5 parameters)
                const charCount = Object.keys(chars).length;
                if (charCount >= 8) {
                    console.log(`\n✅ Enhanced IEMOCAP Active: ${charCount} characteristics detected`);
                } else {
                    console.log(`\n⚠️  Old IEMOCAP detected: Only ${charCount} characteristics`);
                }
            }
        } else {
            console.log(`❌ No speech analysis found - IEMOCAP may not be working`);
        }
        
        // Check main emotion detection
        if (result.emotionDetails) {
            console.log(`\n🎯 Primary Emotion: ${result.emotionDetails.emotion || result.emotion}`);
            console.log(`📈 Confidence: ${((result.emotionDetails.confidence || result.confidence) * 100).toFixed(1)}%`);
            console.log(`🔧 Detection Method: ${result.emotionDetails.method || 'unknown'}`);
            
            if (result.emotionDetails.text_emotion) {
                console.log(`📝 Text Emotion: ${result.emotionDetails.text_emotion}`);
            }
            if (result.emotionDetails.speech_emotion) {
                console.log(`🎤 Speech Emotion: ${result.emotionDetails.speech_emotion}`);
            }
        }
        
        // Legacy format check
        if (result.emotions?.speech) {
            const speech = result.emotions.speech;
            console.log(`🎤 Speech Emotion: ${speech.emotion}`);
            console.log(`📈 Confidence: ${(speech.confidence * 100).toFixed(1)}%`);
            
            if (speech.characteristics) {
                console.log('\n🔍 Enhanced Speech Characteristics:');
                console.log(`   • Energy Level: ${speech.characteristics.energy_level?.toFixed(2) || 'N/A'}`);
                console.log(`   • Pitch Variation: ${speech.characteristics.pitch_variation?.toFixed(2) || 'N/A'}`);
                console.log(`   • Speech Rate: ${speech.characteristics.speech_rate?.toFixed(2) || 'N/A'}`);
                console.log(`   • Voice Quality: ${speech.characteristics.voice_quality?.toFixed(2) || 'N/A'}`);
                console.log(`   • Emotional Intensity: ${speech.characteristics.emotional_intensity?.toFixed(2) || 'N/A'}`);
                console.log(`   • Stress Indicators: ${speech.characteristics.stress_indicators?.toFixed(2) || 'N/A'}`);
                console.log(`   • Vocal Tremor: ${speech.characteristics.vocal_tremor?.toFixed(2) || 'N/A'}`);
                console.log(`   • Breathiness: ${speech.characteristics.breathiness?.toFixed(2) || 'N/A'}`);
                
                // Check if we have the enhanced characteristics (not the old 5 parameters)
                const charCount = Object.keys(speech.characteristics).length;
                if (charCount >= 8) {
                    console.log(`\n✅ Enhanced IEMOCAP Active: ${charCount} characteristics detected`);
                } else {
                    console.log(`\n⚠️  Old IEMOCAP detected: Only ${charCount} characteristics`);
                }
            }
        }
        
        if (result.emotions?.text) {
            console.log(`\n📝 Text Emotion (GoEmotions): ${result.emotions.text.emotion}`);
            console.log(`📈 Confidence: ${(result.emotions.text.confidence * 100).toFixed(1)}%`);
        }
        
        if (result.response) {
            console.log(`\n💬 Therapeutic Response Generated: ${result.response.substring(0, 100)}...`);
        }
        
        // Test 3: Verify no Llama references
        const responseStr = JSON.stringify(result);
        if (responseStr.toLowerCase().includes('llama')) {
            console.log('\n⚠️  Warning: Llama references still found in response');
        } else {
            console.log('\n✅ Llama successfully removed from response pipeline');
        }
        
        console.log('\n🎉 Enhanced IEMOCAP integration test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

testEnhancedIEMOCAP();
