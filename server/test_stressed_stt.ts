import { transcribeAudio } from './services/speechService';
import fs from 'fs';
import path from 'path';

// Function to set PATH environment variable for Python process
function setFFmpegPath() {
  const ffmpegPath = path.join(process.env.LOCALAPPDATA!, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1.1-full_build', 'bin');
  if (!process.env.PATH?.includes(ffmpegPath)) {
    process.env.PATH = `${process.env.PATH};${ffmpegPath}`;
  }
}

async function testStressedAudio() {
  try {
    // Set ffmpeg path before testing
    setFFmpegPath();
    console.log('🔧 Added ffmpeg to PATH for this session');
    
    const audioPath = path.join(process.cwd(), 'server', 'test-audio', 'stressed_test.wav');
    
    console.log('🎯 Testing STT with stressed audio:', audioPath);
    
    if (!fs.existsSync(audioPath)) {
      console.log('❌ Stressed audio file not found:', audioPath);
      return;
    }
    
    const audioBuffer = fs.readFileSync(audioPath);
    console.log(`📁 Loaded stressed audio: ${audioBuffer.length} bytes`);
    console.log('⏳ Starting transcription...');
    
    const startTime = Date.now();
    const text = await transcribeAudio(audioBuffer, 'en');
    const endTime = Date.now();
    
    console.log('\n✅ Stressed Audio STT Results:');
    console.log('📝 Text:', text);
    console.log(`⏱️ Processing time: ${(endTime - startTime) / 1000} seconds`);
    console.log('🎭 Expected: "I feel stressed" or similar');
    
  } catch (error) {
    console.error('❌ Stressed audio test failed:', error);
  }
}

testStressedAudio();
