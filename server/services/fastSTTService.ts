import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getPythonExecutablePath } from '../utils/pythonPath';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * Try cloud-based STT services (more reliable for production)
 */
async function tryCloudSTT(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  // Try OpenAI Whisper API (most reliable)
  if (process.env.OPENAI_API_KEY) {
    try {

      
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', language === 'ur' ? 'ur' : 'en');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json() as { text?: string };
        return result.text || '';
      }
    } catch (error) {
      console.warn('OpenAI STT failed:', error);
    }
  }
  
  throw new Error('No cloud STT available');
}

/**
 * Fast STT service using Whisper Tiny for actual transcription
 * Optimized for speed and accuracy with proper audio handling
 */
export async function fastTranscribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  // First try cloud STT (more reliable for production)
  if (process.env.NODE_ENV === 'production' || process.env.PREFER_CLOUD_STT === 'true') {
    try {
      const cloudResult = await tryCloudSTT(audioBuffer, language);
      if (cloudResult && cloudResult.trim() && !cloudResult.includes('Audio message received')) {
        console.log('✅ Cloud STT success:', cloudResult);
        return cloudResult;
      }
    } catch (cloudError) {
      console.warn('⚠️ Cloud STT failed, trying local:', cloudError instanceof Error ? cloudError.message : String(cloudError));
    }
  }

  return new Promise(async (resolve, reject) => {
    // Check if Python is available before proceeding
    const pythonPath = getPythonExecutablePath();
    if (pythonPath === 'python3' && !fs.existsSync(path.join(process.cwd(), '.venv'))) {
      console.error('❌ FastSTT: Virtual environment not found and system Python may not have required packages');
      reject(new Error('Python environment not properly configured for STT'));
      return;
    }
    try {
      // Create temporary WAV file
      const tempPath = path.join(process.cwd(), `temp_audio_${Date.now()}.wav`);
      await fs.promises.writeFile(tempPath, audioBuffer);

      // Create Python script using Whisper Tiny
      const pythonCode = `
import sys
import os
import warnings
warnings.filterwarnings("ignore")

# Set UTF-8 encoding for output
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

try:
    print("Loading Whisper Tiny model...", file=sys.stderr)
    
    # Import required libraries
    import whisper
    import torch
    
    # Load Whisper Tiny model (fastest option)
    model = whisper.load_model("tiny", device="cpu")
    print("Whisper Tiny loaded successfully", file=sys.stderr)
    
    # Transcribe the audio
    audio_path = "${tempPath.replace(/\\/g, '\\\\')}"
    print(f"Transcribing audio file: {audio_path}", file=sys.stderr)
    
    result = model.transcribe(
        audio_path, 
        language="${language === 'ur' ? 'ur' : 'en'}"
    )
    
    transcribed_text = result["text"].strip()
    print(f"Transcription completed: '{transcribed_text}' ({len(transcribed_text)} chars)", file=sys.stderr)
    
    if transcribed_text:
        print(transcribed_text)
    else:
        print("No speech detected")
        
except ImportError as import_error:
    print(f"Missing dependencies: {import_error}", file=sys.stderr)
    print("Please install: pip install openai-whisper torch", file=sys.stderr)
    print("Audio processing unavailable")
except Exception as e:
    print(f"Transcription error: {str(e)}", file=sys.stderr)
    from datetime import datetime
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    if "${language}" == "ur":
        print(f"آڈیو پیغام موصول ہوا {timestamp} پر")
    else:
        print(f"Voice input received at {timestamp}")
      `;

      // Use cross-platform Python path
      const venvPython = getPythonExecutablePath();
      
      // Set environment (cross-platform)
      const isWindows = process.platform === 'win32';
      const env = {
        ...process.env,
        PYTHONPATH: isWindows 
          ? path.join(process.cwd(), '.venv', 'Lib', 'site-packages')
          : path.join(process.cwd(), '.venv', 'lib', 'python3.11', 'site-packages'),
        PYTHONIOENCODING: 'utf-8',
        ...(isWindows && { PYTHONLEGACYWINDOWSSTDIO: '1' })
      };

      // Spawn Python process
      const python = spawn(venvPython, ['-c', pythonCode], { env });

      let output = '';
      let errorOutput = '';

      // Timeout for Whisper Tiny (should be fast)
      const timeout = setTimeout(() => {
        python.kill();
        reject('Whisper Tiny transcription timeout');
      }, 45000); // 45 second timeout for first-time model download

      python.stdout.on('data', (data) => { 
        output += data.toString(); 
        console.log('[Whisper Tiny Stdout]:', data.toString().trim());
      });
      python.stderr.on('data', (data) => { 
        errorOutput += data.toString(); 
        console.log('[Whisper Tiny Debug]:', data.toString().trim());
      });

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
          console.error('[Whisper Tiny] Process failed with code:', code);
          console.error('[Whisper Tiny] Error output:', errorOutput);
          reject(`Whisper Tiny failed: ${errorOutput.substring(0, 200)}...`);
        } else {
          const transcription = output.trim();
          console.log(`[Whisper Tiny] Final Result: "${transcription}" (${transcription.length} chars, code: ${code})`);
          resolve(transcription || 'No speech detected');
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(`Whisper Tiny process error: ${err.message}`);
      });
    } catch (err) {
      reject(`Whisper Tiny setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
}
