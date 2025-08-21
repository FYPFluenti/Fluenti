// Test voice mode context extraction
import fs from 'fs';
import FormData from 'form-data';

async function testVoiceContext() {
  try {
    console.log('Testing voice mode context extraction...');
    
    // Create a simple WAV file buffer (dummy audio)
    const createMockWAV = () => {
      const header = Buffer.alloc(44);
      header.write('RIFF', 0);
      header.writeUInt32LE(36, 4);
      header.write('WAVE', 8);
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(16000, 24);
      header.writeUInt32LE(32000, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write('data', 36);
      header.writeUInt32LE(0, 40);
      
      const audioData = Buffer.alloc(32000); // 1 second of 16kHz audio
      for (let i = 0; i < 16000; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / 16000) * 32767;
        audioData.writeInt16LE(sample, i * 2);
      }
      
      return Buffer.concat([header, audioData]);
    };

    const audioBuffer = createMockWAV();
    
    // Create form data
    const form = new FormData();
    form.append('audio', audioBuffer, {
      filename: 'test.wav',
      contentType: 'audio/wav'
    });
    form.append('text', 'I had a very long day today because of extra activity');
    form.append('mode', 'voice');
    form.append('language', 'en');

    const response = await fetch('http://localhost:3000/api/emotional-support', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    console.log('\n=== VOICE MODE RESULT ===');
    console.log('Status:', response.status);
    console.log('Emotion:', result.emotion);
    console.log('Confidence:', result.confidence);
    console.log('Context:', result.context || 'No context found');
    console.log('Text Emotion:', result.text_emotion);
    console.log('Voice Emotion:', result.voice_emotion);
    console.log('Method:', result.method);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Wait for server to be ready, then test
setTimeout(testVoiceContext, 5000);