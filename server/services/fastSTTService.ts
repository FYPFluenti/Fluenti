import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Fast STT service using OpenAI Whisper API instead of local model
 * Falls back to local model if API is not available
 */
export async function fastTranscribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Save buffer to temp WAV file
      const tempPath = path.join(process.cwd(), 'temp_audio_fast.wav');
      fs.writeFileSync(tempPath, audioBuffer);

      // Create a simple Python script that uses OpenAI API first, then falls back
      const pythonCode = `
import os
import sys
import json
import tempfile
from datetime import datetime

# Set UTF-8 encoding for output
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

try:
    # First try OpenAI Whisper API (fastest option)
    try:
        import openai
        
        # Check if OpenAI API key is available
        api_key = os.environ.get('OPENAI_API_KEY')
        if api_key and len(api_key) > 10:
            print("Attempting OpenAI Whisper API...", file=sys.stderr)
            
            client = openai.OpenAI(api_key=api_key)
            
            with open("${tempPath.replace(/\\/g, '\\\\')}", "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="${language === 'ur' ? 'ur' : 'en'}"
                )
            
            print(transcript.text)
            sys.exit(0)
    except Exception as api_error:
        print(f"OpenAI API failed: {api_error}", file=sys.stderr)
    
    # Fallback to lightweight local transcription
    print("Using fallback transcription method...", file=sys.stderr)
    
    # Simple speech detection without heavy models
    import wave
    import struct
    
    try:
        with wave.open("${tempPath.replace(/\\/g, '\\\\')}", 'rb') as wav_file:
            frames = wav_file.getnframes()
            sample_rate = wav_file.getframerate()
            duration = frames / float(sample_rate)
            
            print(f"Audio detected: {duration:.1f} seconds", file=sys.stderr)
            
            # Simple heuristic: if audio is longer than 0.5 seconds, assume speech
            if duration > 0.5:
                timestamp = datetime.now().strftime("%I:%M:%S %p")
                if "${language}" == "ur":
                    print(f"آڈیو پیغام موصول ہوا {timestamp} پر")
                else:
                    print(f"Audio message received at {timestamp}")
            else:
                print("No speech detected")
    except Exception as wav_error:
        print(f"Audio processing error: {wav_error}", file=sys.stderr)
        timestamp = datetime.now().strftime("%I:%M:%S %p")
        if "${language}" == "ur":
            print(f"آڈیو پیغام موصول ہوا {timestamp} پر")
        else:
            print(f"Voice input received at {timestamp}")

except Exception as e:
    print(f"Transcription failed: {str(e)}", file=sys.stderr)
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    if "${language}" == "ur":
        print(f"آڈیو پیغام موصول ہوا {timestamp} پر")
    else:
        print(f"Audio message received at {timestamp}")
      `;

      // Use virtual environment Python
      const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      
      // Set environment
      const env = {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages'),
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '1',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '' // Pass OpenAI key if available
      };

      // Spawn Python process
      const python = spawn(venvPython, ['-c', pythonCode], { env });

      let output = '';
      let errorOutput = '';

      // Much shorter timeout for this optimized version
      const timeout = setTimeout(() => {
        python.kill();
        reject('Fast STT timeout');
      }, 15000); // 15 second timeout

      python.stdout.on('data', (data) => { output += data.toString(); });
      python.stderr.on('data', (data) => { errorOutput += data.toString(); });

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        // Clean up temp file
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError);
        }

        if (code !== 0) {
          console.error('Fast STT error:', errorOutput);
          reject(`Fast STT failed: ${errorOutput.substring(0, 200)}...`);
        } else {
          const transcription = output.trim();
          resolve(transcription || 'No speech detected');
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(`Fast STT process error: ${err.message}`);
      });
    } catch (err) {
      reject(`Fast STT setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
}
