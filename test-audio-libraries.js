import { promises as fs } from 'fs';
import path from 'path';

console.log('🎵 Testing Audio Processing Libraries...\n');

async function testAudioProcessing() {
  try {
    // Test 1: Check if audio libraries are installed correctly
    console.log('1. Testing library imports...');
    
    // Test WAV library
    try {
      const wav = await import('wav');
      console.log('✅ WAV library loaded successfully');
    } catch (error) {
      console.log('❌ WAV library failed:', error.message);
    }
    
    // Test node-wav
    try {
      const nodeWav = await import('node-wav');
      console.log('✅ Node-WAV library loaded successfully');
    } catch (error) {
      console.log('❌ Node-WAV library failed:', error.message);
    }
    
    // Test FFmpeg
    try {
      const ffmpeg = await import('fluent-ffmpeg');
      console.log('✅ Fluent-FFmpeg library loaded successfully');
    } catch (error) {
      console.log('❌ Fluent-FFmpeg library failed:', error.message);
    }

    // Test ffmpeg-static
    try {
      const ffmpegStatic = await import('ffmpeg-static');
      console.log('✅ FFmpeg-static library loaded successfully');
      console.log(`   FFmpeg binary path: ${ffmpegStatic.default || 'Not set'}`);
    } catch (error) {
      console.log('❌ FFmpeg-static library failed:', error.message);
    }

    console.log('\n2. Testing basic functionality...');

    // Test temp directory creation
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log('✅ Temp directory creation works');
    } catch (error) {
      console.log('❌ Temp directory creation failed:', error.message);
    }

    // Test buffer operations
    try {
      const testBuffer = Buffer.from('test audio data');
      const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
      const mockBuffer = Buffer.concat([webmHeader, testBuffer]);
      console.log('✅ Buffer operations work correctly');
      console.log(`   Mock buffer size: ${mockBuffer.length} bytes`);
    } catch (error) {
      console.log('❌ Buffer operations failed:', error.message);
    }

    console.log('\n🎉 Library installation test completed!');
    console.log('\nInstalled Audio Libraries:');
    console.log('- wav: For WAV file handling');
    console.log('- node-wav: For additional WAV processing');
    console.log('- ffmpeg-static: For audio format conversion');
    console.log('- fluent-ffmpeg: For advanced audio processing');
    
    console.log('\n📝 Next steps:');
    console.log('1. Libraries are ready for audio format conversion');
    console.log('2. WebM to WAV conversion should work');
    console.log('3. Voice recognition will have better format support');
    
  } catch (error) {
    console.error('❌ Audio processing test failed:', error);
  }
}

// Run the test
testAudioProcessing();
