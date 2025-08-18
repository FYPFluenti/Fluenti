import { transcribeAudio } from './services/speechService';
import { detectEmotionFromText, detectEmotionFromAudio, combineEmotions } from './services/emotionService';
import fs from 'fs';
import path from 'path';

// Function to set PATH environment variable for Python process
function setFFmpegPath() {
  const ffmpegPath = path.join(process.env.LOCALAPPDATA!, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1.1-full_build', 'bin');
  if (!process.env.PATH?.includes(ffmpegPath)) {
    process.env.PATH = `${process.env.PATH};${ffmpegPath}`;
  }
}

async function testVoicePipelineComponents() {
  console.log('🔧 Phase 2 Voice Pipeline Component Test\n');
  
  try {
    setFFmpegPath();
    
    // Test both audio files
    const audioFiles = [
      { name: 'Anxious Test', file: 'english_test.wav', expected: 'anxious' },
      { name: 'Stressed Test', file: 'stressed_test.wav', expected: 'stressed' }
    ];
    
    for (const { name, file, expected } of audioFiles) {
      console.log(`\n📋 Testing: ${name} (${file})`);
      console.log('=' .repeat(50));
      
      const audioPath = path.join(process.cwd(), 'server', 'test-audio', file);
      if (!fs.existsSync(audioPath)) {
        console.log(`❌ ${file} not found`);
        continue;
      }
      
      const audioBuffer = fs.readFileSync(audioPath);
      console.log(`📁 Loaded: ${audioBuffer.length} bytes`);
      
      // Step 1: STT Test
      console.log('\n🎤 Step 1: Speech-to-Text');
      const sttStart = Date.now();
      try {
        const transcription = await transcribeAudio(audioBuffer, 'en');
        const sttTime = Date.now() - sttStart;
        console.log(`✅ Transcription: "${transcription}"`);
        console.log(`⏱️ STT Time: ${(sttTime / 1000).toFixed(2)}s`);
        
        // Step 2: Text Emotion Detection
        console.log('\n😊 Step 2: Text Emotion Analysis');
        const textEmotionStart = Date.now();
        const textEmotion = await detectEmotionFromText(transcription, 'en');
        const textEmotionTime = Date.now() - textEmotionStart;
        console.log(`✅ Text Emotion: ${textEmotion.emotion} (score: ${textEmotion.score?.toFixed(3)})`);
        console.log(`⏱️ Text Emotion Time: ${textEmotionTime}ms`);
        
        // Step 3: Voice Emotion Detection
        console.log('\n🎵 Step 3: Voice Emotion Analysis');
        const voiceEmotionStart = Date.now();
        let voiceEmotion = null;
        try {
          voiceEmotion = await detectEmotionFromAudio(audioBuffer, 'en');
          const voiceEmotionTime = Date.now() - voiceEmotionStart;
          console.log(`✅ Voice Emotion: ${voiceEmotion.emotion} (score: ${voiceEmotion.score?.toFixed(3)})`);
          console.log(`⏱️ Voice Emotion Time: ${voiceEmotionTime}ms`);
        } catch (error) {
          console.log(`⚠️ Voice emotion failed: ${error.message}`);
        }
        
        // Step 4: Combined Emotion
        console.log('\n🔗 Step 4: Combined Emotion Analysis');
        let finalEmotion = textEmotion;
        if (voiceEmotion) {
          finalEmotion = combineEmotions(textEmotion, voiceEmotion);
          console.log(`✅ Combined Emotion: ${finalEmotion.emotion} (score: ${finalEmotion.score?.toFixed(3)})`);
          console.log(`🎯 Combination: Text(${textEmotion.emotion}) + Voice(${voiceEmotion.emotion}) = ${finalEmotion.emotion}`);
        } else {
          console.log(`✅ Using Text-Only: ${finalEmotion.emotion} (score: ${finalEmotion.score?.toFixed(3)})`);
        }
        
        // Step 5: Validation
        console.log('\n📊 Validation Results');
        const transcriptionValid = transcription.toLowerCase().includes(expected.toLowerCase()) ||
                                 transcription.toLowerCase().includes(expected === 'stressed' ? 'stress' : expected);
        const emotionValid = finalEmotion.emotion.toLowerCase().includes(expected.toLowerCase()) ||
                           finalEmotion.emotion.toLowerCase().includes(expected === 'stressed' ? 'stress' : expected) ||
                           (expected === 'anxious' && ['anxiety', 'fear', 'nervous'].includes(finalEmotion.emotion.toLowerCase()));
        
        console.log(`🎯 Expected: "${expected}"`);
        console.log(`✅ STT Accuracy: ${transcriptionValid ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Emotion Accuracy: ${emotionValid ? 'PASS' : `FAIL (got: ${finalEmotion.emotion})`}`);
        console.log(`✅ Pipeline Health: ${transcriptionValid && emotionValid ? 'EXCELLENT' : 'NEEDS REVIEW'}`);
        
      } catch (error) {
        console.log(`❌ STT Failed: ${error.message}`);
      }
    }
    
    console.log('\n🏁 Voice Pipeline Component Test Complete');
    
  } catch (error) {
    console.error('❌ Component test failed:', error);
  }
}

async function testSystemCapabilities() {
  console.log('\n🔍 System Capabilities Check\n');
  console.log('=' .repeat(50));
  
  // Python Environment Check
  console.log('🐍 Python Environment:');
  console.log(`   Virtual Env: ${process.cwd()}/.venv/Scripts/python.exe`);
  
  // Audio Files Check
  console.log('\n🎵 Audio Test Files:');
  const testDir = path.join(process.cwd(), 'server', 'test-audio');
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir).filter(f => f.endsWith('.wav'));
    files.forEach(file => {
      const filePath = path.join(testDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ✅ ${file}: ${(stats.size / 1024).toFixed(1)}KB`);
    });
  }
  
  // FFmpeg Check
  console.log('\n⚙️ FFmpeg Configuration:');
  const ffmpegPath = path.join(process.env.LOCALAPPDATA!, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1.1-full_build', 'bin');
  console.log(`   Path: ${ffmpegPath}`);
  console.log(`   Available: ${fs.existsSync(ffmpegPath + '/ffmpeg.exe') ? 'YES' : 'NO'}`);
  
  // Model Cache Check  
  console.log('\n🤖 AI Model Cache:');
  const cacheDir = path.join(process.cwd(), 'models', 'hf_cache', 'hub');
  if (fs.existsSync(cacheDir)) {
    const models = fs.readdirSync(cacheDir).filter(d => d.includes('whisper'));
    models.forEach(model => {
      console.log(`   ✅ ${model}`);
    });
  } else {
    console.log('   ⚠️ Cache directory not found');
  }
  
  console.log('\n🎊 System Capability Check Complete');
}

// Run both tests
async function runAllTests() {
  await testSystemCapabilities();
  await testVoicePipelineComponents();
}

runAllTests();
