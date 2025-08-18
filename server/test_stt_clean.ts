import { transcribeAudio } from './services/speechService';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Function to set PATH environment variable for Python process
function setFFmpegPath() {
  const ffmpegPath = path.join(process.env.LOCALAPPDATA!, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1.1-full_build', 'bin');
  if (!process.env.PATH?.includes(ffmpegPath)) {
    process.env.PATH = `${process.env.PATH};${ffmpegPath}`;
  }
}

async function test() {
  try {
    // Set ffmpeg path before testing
    setFFmpegPath();
    console.log('🔧 Added ffmpeg to PATH for this session');
    
    // Note: You need to provide the path to your actual audio file
    // Record a WAV file using Audacity and place it in the test-audio directory
    const audioPath = path.join(process.cwd(), 'server', 'test-audio', 'stressed_test.wav');
    
    console.log('🎯 Testing STT with audio file:', audioPath);
    console.log('Note: Make sure to record a WAV file and place it in server/test-audio/');
    
    // Check if file exists
    if (!fs.existsSync(audioPath)) {
      console.log('❌ Audio file not found. Please:');
      console.log('1. Record a WAV file using Audacity');
      console.log('2. Save it as server/test-audio/english_test.wav');
      console.log('3. Example content: "I feel anxious" or any clear English speech');
      console.log('4. See server/test-audio/README.md for detailed instructions');
      
      // Also check what files are in the directory
      const testDir = path.join(process.cwd(), 'server', 'test-audio');
      if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir);
        console.log(`\n📁 Files in ${testDir}:`, files);
      }
      return;
    }
    
    const audioBuffer = fs.readFileSync(audioPath);
    console.log(`📁 Loaded audio file: ${audioBuffer.length} bytes`);
    console.log('⏳ Starting transcription (first run may take 5-10 minutes for model download)...');
    
    const startTime = Date.now();
    const text = await transcribeAudio(audioBuffer, 'en');
    const endTime = Date.now();
    
    console.log('\n✅ Transcription Results:');
    console.log('Text:', text);
    console.log(`⏱️ Processing time: ${(endTime - startTime) / 1000} seconds`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error && error.message.includes('Python error')) {
      console.log('💡 This might be a Python environment issue. Make sure:');
      console.log('1. Python virtual environment is activated');
      console.log('2. Required packages are installed (torch, transformers)');
      console.log('3. CUDA is available (for GPU acceleration)');
    }
  }
}

test();
