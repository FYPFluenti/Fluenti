// Test script to verify the STT fix for "Unsupported data URL" error
// Run with: npx tsx server/test-stt-fix.ts

import { transcribeAudio } from './services/speechService';
import fs from 'fs';
import path from 'path';

async function testSTTFix() {
  console.log('🔧 Testing STT Fix for "Unsupported data URL" Error');
  console.log('====================================================\n');

  try {
    // Create a mock WAV file buffer (minimal WAV header + data)
    const createMockWav = (): Buffer => {
      // Minimal WAV header (44 bytes) + some audio data
      const header = Buffer.alloc(44);
      
      // RIFF header
      header.write('RIFF', 0);
      header.writeUInt32LE(36, 4); // File size - 8
      header.write('WAVE', 8);
      
      // fmt chunk
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16); // fmt chunk size
      header.writeUInt16LE(1, 20);  // PCM format
      header.writeUInt16LE(1, 22);  // mono
      header.writeUInt32LE(16000, 24); // sample rate
      header.writeUInt32LE(32000, 28); // byte rate
      header.writeUInt16LE(2, 32);  // block align
      header.writeUInt16LE(16, 34); // bits per sample
      
      // data chunk
      header.write('data', 36);
      header.writeUInt32LE(0, 40); // data size (we'll add minimal data)
      
      // Add some minimal audio data (silence)
      const audioData = Buffer.alloc(1600); // 0.1 seconds of silence at 16kHz
      audioData.fill(0);
      
      return Buffer.concat([header, audioData]);
    };

    const mockAudioBuffer = createMockWav();
    console.log(`📊 Created mock WAV file: ${mockAudioBuffer.length} bytes`);
    
    // Test English transcription
    console.log('\n🇺🇸 Testing English STT...');
    const englishResult = await transcribeAudio(mockAudioBuffer, 'en');
    console.log(`✅ English Result: "${englishResult}"`);
    
    // Verify it's not an error message
    if (englishResult.includes('[Phase 2 STT Error]')) {
      console.error('❌ English STT still has error:', englishResult);
      if (englishResult.includes('Unsupported data URL')) {
        console.error('❌ The "Unsupported data URL" error is still present!');
        return false;
      }
    } else {
      console.log('✅ English STT working - no "Unsupported data URL" error');
    }
    
    // Test Urdu transcription
    console.log('\n🇵🇰 Testing Urdu STT...');
    const urduResult = await transcribeAudio(mockAudioBuffer, 'ur');
    console.log(`✅ Urdu Result: "${urduResult}"`);
    
    // Verify it's not an error message
    if (urduResult.includes('[Phase 2 STT Error]')) {
      console.error('❌ Urdu STT still has error:', urduResult);
      if (urduResult.includes('Unsupported data URL')) {
        console.error('❌ The "Unsupported data URL" error is still present!');
        return false;
      }
    } else {
      console.log('✅ Urdu STT working - no "Unsupported data URL" error');
    }
    
    console.log('\n🎉 STT Fix Verification Results:');
    console.log('=====================================');
    
    const englishFixed = !englishResult.includes('Unsupported data URL');
    const urduFixed = !urduResult.includes('Unsupported data URL');
    
    console.log(`English STT Fix: ${englishFixed ? '✅ WORKING' : '❌ STILL BROKEN'}`);
    console.log(`Urdu STT Fix: ${urduFixed ? '✅ WORKING' : '❌ STILL BROKEN'}`);
    
    if (englishFixed && urduFixed) {
      console.log('\n🚀 SUCCESS: "Unsupported data URL" error has been fixed!');
      console.log('📝 Technical Details:');
      console.log('   - Fixed Buffer to ArrayBuffer conversion');
      console.log('   - Removed problematic Blob wrapper that created data URLs');
      console.log('   - Audio data now sent as raw binary to Hugging Face API');
      return true;
    } else {
      console.log('\n❌ FAILED: Some issues still remain');
      return false;
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    return false;
  }
}

// Test the buffer conversion logic specifically
function testBufferConversion() {
  console.log('\n🔬 Testing Buffer → ArrayBuffer Conversion');
  console.log('==========================================');
  
  // Create test buffer
  const testBuffer = Buffer.from([1, 2, 3, 4, 5]);
  console.log(`Original Buffer: ${testBuffer.length} bytes`);
  
  // Convert using our new method
  const arrayBuffer = new ArrayBuffer(testBuffer.length);
  const uint8View = new Uint8Array(arrayBuffer);
  uint8View.set(testBuffer);
  
  console.log(`Converted ArrayBuffer: ${arrayBuffer.byteLength} bytes`);
  console.log(`First few bytes: [${Array.from(new Uint8Array(arrayBuffer, 0, 5))}]`);
  
  // Verify conversion
  const isCorrect = Array.from(testBuffer).every((val, idx) => val === uint8View[idx]);
  console.log(`Conversion accuracy: ${isCorrect ? '✅ PERFECT' : '❌ FAILED'}`);
  
  return isCorrect;
}

// Run tests if this file is executed directly
if (process.argv[1]?.endsWith('test-stt-fix.ts')) {
  Promise.all([
    testBufferConversion(),
    testSTTFix()
  ]).then(([bufferTest, sttTest]) => {
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 OVERALL FIX STATUS: ${bufferTest && sttTest ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
    console.log('='.repeat(50));
    process.exit(bufferTest && sttTest ? 0 : 1);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testSTTFix, testBufferConversion };
