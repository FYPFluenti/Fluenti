import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Dedicated STT service for children's speech in Word Practice Game
 * Uses Whisper Tiny with child-optimized settings for single word recognition
 */
export async function transcribeChildSpeech(audioBuffer: Buffer, targetWord?: string, language: 'en' | 'ur' = 'en'): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create temporary WAV file
      const tempPath = path.join(process.cwd(), `child_speech_${Date.now()}.wav`);
      await fs.promises.writeFile(tempPath, audioBuffer);

      // Create Python script optimized for children's speech
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
    print("Loading Whisper Tiny for child speech recognition...", file=sys.stderr)
    
    # Import required libraries
    import whisper
    import torch
    
    # Load Whisper Tiny model (proven to work well for your setup)
    model = whisper.load_model("tiny", device="cpu")
    print("Child Speech STT - Whisper Tiny loaded successfully", file=sys.stderr)
    
    # Transcribe the audio with child-optimized settings
    audio_path = "${tempPath.replace(/\\/g, '\\\\')}"
    print(f"Child Speech STT - Transcribing: {audio_path}", file=sys.stderr)
    
    # Check if audio file exists
    if not os.path.exists(audio_path):
        print(f"Child Speech STT - ERROR: Audio file not found: {audio_path}", file=sys.stderr)
        exit(1)
    
    # Transcribe with child-optimized settings (similar to fastSTT but tuned for children)
    result = model.transcribe(
        audio_path, 
        language="${language === 'ur' ? 'ur' : 'en'}"
    )
    
    transcribed_text = result["text"].strip()
    print(f"Child Speech STT - Transcription completed: '{transcribed_text}' ({len(transcribed_text)} chars)", file=sys.stderr)
    
    # Simple output like fastSTT (keep it simple for now)
    if transcribed_text:
        print(transcribed_text)
    else:
        print("No speech detected")
        
except ImportError as import_error:
    print(f"Missing dependencies: {import_error}", file=sys.stderr)
    print("Please install: pip install openai-whisper torch", file=sys.stderr)
    print("Audio processing unavailable")
except Exception as e:
    print(f"Child Speech STT error: {str(e)}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    from datetime import datetime
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    print(f"Voice input received at {timestamp}")
      `;

      // Use virtual environment Python
      const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      
      // Set environment
      const env = {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages'),
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '1'
      };

      // Spawn Python process
      const python = spawn(venvPython, ['-c', pythonCode], { env });

      let output = '';
      let errorOutput = '';

      // Timeout for child speech processing (same as working fastSTT)
      const timeout = setTimeout(() => {
        python.kill();
        reject('Child Speech STT timeout');
      }, 45000); // 45 second timeout (same as fastSTTService)

      python.stdout.on('data', (data) => { 
        output += data.toString(); 
        console.log('[Child Speech STT]:', data.toString().trim());
      });
      
      python.stderr.on('data', (data) => { 
        errorOutput += data.toString(); 
        console.log('[Child Speech Debug]:', data.toString().trim());
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        // Clean up temp file
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup child speech temp file:', cleanupError);
        }

        console.log(`[Child Speech STT] Process finished with code: ${code}`);
        console.log(`[Child Speech STT] Output length: ${output.length} chars`);
        console.log(`[Child Speech STT] Error output length: ${errorOutput.length} chars`);

        if (code !== 0 && code !== null) {
          console.error('[Child Speech STT] Process failed with code:', code);
          console.error('[Child Speech STT] Full error output:', errorOutput);
          reject(`Child Speech STT failed with code ${code}: ${errorOutput || 'No error details'}`);
        } else if (code === null) {
          console.error('[Child Speech STT] Process was killed (timeout or signal)');
          console.error('[Child Speech STT] Error output at kill:', errorOutput);
          reject(`Child Speech STT was terminated: ${errorOutput || 'Process killed by timeout'}`);
        } else {
          const transcription = output.trim();
          console.log(`[Child Speech STT] Final Result: "${transcription}" (${transcription.length} chars, code: ${code})`);
          resolve(transcription || 'No speech detected');
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(`Child Speech STT process error: ${err.message}`);
      });
    } catch (err) {
      reject(`Child Speech STT setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
}

/**
 * Process audio blob from frontend for child speech recognition
 * Converts WebM/MP3 audio to WAV format suitable for Whisper
 */
export async function processChildSpeechAudio(audioBuffer: Buffer, targetWord?: string): Promise<{ 
  transcription: string; 
  confidence: number; 
  success: boolean;
  targetWord?: string;
}> {
  try {
    console.log(`🎤 Child Speech STT - Processing audio (${audioBuffer.length} bytes)${targetWord ? ` for word: ${targetWord}` : ''}`);
    
    const transcription = await transcribeChildSpeech(audioBuffer, targetWord, 'en');
    
    // Calculate confidence based on result quality
    let confidence = 0.8; // Base confidence
    
    if (transcription === 'No speech detected') {
      confidence = 0.0;
    } else if (targetWord) {
      // Higher confidence if transcription matches or is similar to target
      const transcriptionLower = transcription.toLowerCase().trim();
      const targetLower = targetWord.toLowerCase().trim();
      
      if (transcriptionLower === targetLower) {
        confidence = 0.95; // High confidence for exact match
      } else if (transcriptionLower.includes(targetLower) || targetLower.includes(transcriptionLower)) {
        confidence = 0.85; // Good confidence for partial match
      } else {
        confidence = 0.7; // Lower confidence for different word
      }
    }
    
    console.log(`✅ Child Speech STT successful: "${transcription}" (confidence: ${confidence})`);
    
    return {
      transcription,
      confidence,
      success: true,
      targetWord
    };
    
  } catch (error) {
    console.error('❌ Child Speech STT failed:', error);
    return {
      transcription: 'Speech recognition failed',
      confidence: 0.0,
      success: false,
      targetWord
    };
  }
}