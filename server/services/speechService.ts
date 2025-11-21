import { mongoStorage } from "../mongoStorage";
import { generateSpeechFeedback } from "./openai";
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getPythonExecutablePath } from '../utils/pythonPath';

// Main transcription function using local Whisper
export async function transcribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Save buffer to temp WAV file
      const tempPath = path.join(process.cwd(), 'temp_audio.wav');
      fs.writeFileSync(tempPath, audioBuffer);

      // Use the smallest possible models to avoid memory issues
      // Use base model for better accuracy but still fast loading
      const model = language === 'ur' ? 'openai/whisper-base' : 'openai/whisper-base';
      
      // Ensure ffmpeg is available in Python environment
      const ffmpegPath = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1.1-full_build', 'bin');
      
      const pythonCode = `
import os
import torch
import gc
import sys
from transformers import pipeline
import locale

# Set UTF-8 encoding for output
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Add ffmpeg to PATH for this Python session (prepend to ensure it's found)
ffmpeg_path = r"${ffmpegPath.replace(/\\/g, '\\\\')}"
if ffmpeg_path not in os.environ.get('PATH', ''):
    os.environ['PATH'] = ffmpeg_path + os.pathsep + os.environ.get('PATH', '')

try:
    # Force CPU usage for training compatibility
    device = -1  # Force CPU
    torch_dtype = torch.float32  # Use float32 for CPU
    
    print("Using device: CPU (forced for training compatibility)", file=sys.stderr)
    if torch.cuda.is_available():
        print("GPU available but using CPU for stability", file=sys.stderr)
    
    # Create pipeline with CPU settings
    pipe = pipeline(
        "automatic-speech-recognition", 
        model="${model}",
        device=device,
        torch_dtype=torch_dtype
    )
    
    print("Model loaded successfully on CPU", file=sys.stderr)
    
    # Process audio file
    result = pipe("${tempPath.replace(/\\/g, '\\\\')}")
    
    # Clean up memory immediately after use
    del pipe
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Output the transcription with proper encoding handling
    transcription = result.get('text', '').strip()
    if transcription:
        print(transcription)
    else:
        print("No speech detected")
    
except Exception as e:
    error_msg = str(e).replace('"', "'")
    print(f"Whisper processing failed: {error_msg}", file=sys.stderr)
    # Clean up on error
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    # Return error message that will be caught by the fallback system
    raise Exception(f"Model processing error: {error_msg}")
      `;

      // Use cross-platform Python path
      const venvPython = getPythonExecutablePath();
      
      // Set environment for spawned process with proper Unicode support
      const isWindows = process.platform === 'win32';
      const env = { 
        ...process.env,
        PYTHONPATH: isWindows 
          ? path.join(process.cwd(), '.venv', 'Lib', 'site-packages')
          : path.join(process.cwd(), '.venv', 'lib', 'python3.11', 'site-packages'),
        PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:128',
        OMP_NUM_THREADS: '2',
        CUDA_VISIBLE_DEVICES: '0',
        HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
        PYTHONIOENCODING: 'utf-8',  // Force UTF-8 encoding
        PYTHONLEGACYWINDOWSSTDIO: '1'  // Enable legacy Windows stdio handling
      };
      
      // Spawn Python process using virtual environment
      const python = spawn(venvPython, ['-c', pythonCode], { env });

      let output = '';
      let errorOutput = '';
      
      // Set a timeout to prevent hanging - increased for first-time model loading
      const timeout = setTimeout(() => {
        python.kill();
        reject('STT timeout - model loading or processing took too long');
      }, 180000); // 3 minute timeout for first-time model loading
      
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
          console.error('Python STT error:', errorOutput);
          
          // Check for specific memory errors
          if (errorOutput.includes('memory allocation') || errorOutput.includes('OutOfMemoryError')) {
            reject('STT failed: Insufficient memory to load Whisper model. Try with a smaller audio file.');
          } else if (errorOutput.includes('No module named')) {
            reject('STT failed: Missing Python dependencies. Please check installation.');
          } else {
            reject(`STT failed: ${errorOutput.substring(0, 200)}...`);
          }
        } else {
          const transcription = output.trim();
          if (transcription.includes('Could not transcribe audio')) {
            reject('STT failed: Model could not process the audio file');
          } else {
            resolve(transcription || 'No speech detected');
          }
        }
      });
      
      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(`STT process error: ${err.message}`);
      });
    } catch (err) {
      reject(`STT setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
}

export class SpeechService {
  static async createSession(userId: string, sessionType: 'assessment' | 'exercise' | 'practice') {
    const session = await mongoStorage.createSpeechSession({
      userId,
      sessionType,
      exerciseData: {},
    });
    
    return session;
  }

  static async recordSpeechAttempt(
    sessionId: string,
    word: string,
    phonetic: string,
    userTranscription: string,
    language: 'english' | 'urdu',
    userAudio?: string
  ) {
    try {
      // Generate AI feedback
      const feedback = await generateSpeechFeedback(word, phonetic, userTranscription, language);
      
      // Get session to get userId
      const session = await mongoStorage.getSpeechSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Record the attempt
      const record = await mongoStorage.createSpeechRecord({
        sessionId,
        userId: session.userId,
        transcription: userTranscription,
        accuracy: feedback.accuracy,
        feedback: feedback.feedback,
        audioPath: userAudio,
      });

      // Update session progress
      await this.updateSessionProgress(sessionId, feedback.accuracy);
      
      return {
        id: record.id,
        accuracyScore: feedback.accuracy,
        feedback: feedback.feedback,
        phoneticAnalysis: feedback.phoneticAnalysis || '',
        improvements: feedback.improvements || []
      };
    } catch (error) {
      console.error('Error in recordSpeechAttempt:', error);
      throw error;
    }
  }

  static async updateSessionProgress(sessionId: string, latestScore: number) {
    // For now, just update the session with the latest accuracy
    await mongoStorage.updateSpeechSession(sessionId, {
      accuracyScore: latestScore,
      wordsCompleted: 1, // Increment this properly later
    });
  }

  static async updateUserProgress(userId: string, sessionScore: number) {
    try {
      await mongoStorage.updateUserProgress(userId, {
        exerciseType: 'speech_practice',
        score: sessionScore,
        accuracy: sessionScore,
        completionTime: 0, // Could be calculated if needed
      });
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  static async getUserProgress(userId: string) {
    try {
      const progressArray = await mongoStorage.getUserProgress(userId);
      const sessions = await mongoStorage.getUserSpeechSessions(userId, 10);
      
      // Calculate aggregated progress from the array
      const speechProgress = progressArray.find(p => p.exerciseType === 'speech_practice');
      
      return {
        totalSessions: speechProgress?.totalAttempts || 0,
        totalWords: speechProgress?.totalAttempts || 0, // Using attempts as proxy for words
        averageAccuracy: speechProgress?.accuracies?.length > 0 
          ? speechProgress.accuracies.reduce((a: number, b: number) => a + b, 0) / speechProgress.accuracies.length 
          : 0,
        streakDays: 0, // This would need to be calculated based on session dates
        recentSessions: sessions,
        skillLevels: {}, // Could be expanded later
        achievements: [], // Could be expanded later
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

}
