import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the STT service
import { fastTranscribeAudio } from './services/fastSTTService.js';

async function testWhisperTiny() {
    try {
        console.log('Testing Whisper Tiny STT...');
        
        // Load test audio file
        const audioPath = path.join(__dirname, 'test-audio', 'english_test.wav');
        const audioBuffer = fs.readFileSync(audioPath);
        
        console.log(`Loaded audio file: ${audioPath} (${audioBuffer.length} bytes)`);
        
        // Test transcription
        const result = await fastTranscribeAudio(audioBuffer, 'en');
        
        console.log('Transcription result:', result);
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWhisperTiny();
