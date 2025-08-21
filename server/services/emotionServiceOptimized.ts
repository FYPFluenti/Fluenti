// Phase 3: OPTIMIZED Emotion Detection Service  
// Uses persistent Python emotion server for high performance
// Model stays loaded in memory, eliminating startup overhead

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';

interface EmotionResult {
  emotion: string;
  confidence: number;
  all_scores?: Record<string, number>;
  context?: string[];
  error?: string;
  method?: string;
}

interface CombinedEmotionResult {
  combined: EmotionResult & {
    text_emotion?: string;
    voice_emotion?: string;
    text_confidence?: number;
    voice_confidence?: number;
    weights?: { text: number; voice: number };
  };
  text: EmotionResult;
  voice: EmotionResult;
}

class PersistentEmotionServer {
  private static instance: PersistentEmotionServer;
  private process: ChildProcessWithoutNullStreams | null = null;
  private isReady = false;
  private requestQueue: Array<{
    request: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor() {
    this.startServer();
  }

  static getInstance(): PersistentEmotionServer {
    if (!PersistentEmotionServer.instance) {
      PersistentEmotionServer.instance = new PersistentEmotionServer();
    }
    return PersistentEmotionServer.instance;
  }

  private startServer() {
    try {
      const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const scriptPath = path.join(process.cwd(), 'server', 'python', 'emotion_server.py');

      if (!fs.existsSync(scriptPath)) {
        console.error('❌ Persistent emotion server script not found');
        return;
      }

      console.log('🚀 Starting persistent emotion detection server...');

      this.process = spawn(pythonPath, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages') }
      });

      this.process.stderr.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        console.log(`[Emotion Server] ${message}`);
        
        if (message.includes('ready for requests')) {
          this.isReady = true;
          console.log('✅ Persistent emotion server is ready');
          this.processQueue();
        }
      });

      this.process.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.handleResponse(line.trim());
          }
        }
      });

      this.process.on('close', (code) => {
        console.log(`❌ Emotion server process exited with code ${code}`);
        this.isReady = false;
        this.process = null;
        
        // Reject any pending requests
        while (this.requestQueue.length > 0) {
          const { reject } = this.requestQueue.shift()!;
          reject(new Error('Emotion server process terminated'));
        }
      });

      this.process.on('error', (error) => {
        console.error('❌ Emotion server process error:', error);
        this.isReady = false;
      });

    } catch (error) {
      console.error('❌ Failed to start emotion server:', error);
    }
  }

  private handleResponse(jsonLine: string) {
    try {
      const result = JSON.parse(jsonLine);
      
      if (this.requestQueue.length > 0) {
        const { resolve } = this.requestQueue.shift()!;
        resolve(result);
        
        // Process next request in queue if any
        if (this.requestQueue.length > 0) {
          try {
            const nextRequest = this.requestQueue[0].request;
            const jsonRequest = JSON.stringify(nextRequest) + '\n';
            this.process?.stdin.write(jsonRequest);
          } catch (error) {
            console.error('❌ Failed to send next request in queue:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse emotion server response:', error);
      
      if (this.requestQueue.length > 0) {
        const { reject } = this.requestQueue.shift()!;
        reject(new Error('Invalid response from emotion server'));
      }
    }
  }

  private processQueue() {
    // Process any queued requests now that server is ready
    // (No action needed here as sendRequest handles queuing)
  }

  async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Emotion server not running'));
        return;
      }

      // Add timestamp and unique ID for better tracking
      const requestId = Date.now() + Math.random();
      const requestWithId = { ...request, requestId };
      
      // Add to queue
      this.requestQueue.push({ request: requestWithId, resolve, reject });

      if (this.isReady && this.requestQueue.length === 1) {
        // Send request immediately if no other requests in queue
        try {
          const jsonRequest = JSON.stringify(requestWithId) + '\n';
          this.process.stdin.write(jsonRequest);
        } catch (error) {
          // Remove from queue if sending failed
          const index = this.requestQueue.findIndex(item => item.resolve === resolve);
          if (index >= 0) {
            this.requestQueue.splice(index, 1);
          }
          reject(error);
        }
      }
      
      // Set timeout for request (increased to 15 seconds)
      setTimeout(() => {
        const index = this.requestQueue.findIndex(item => item.resolve === resolve);
        if (index >= 0) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Emotion detection request timeout'));
        }
      }, 15000); // 15 second timeout
    });
  }

  shutdown() {
    if (this.process) {
      console.log('🛑 Shutting down emotion server...');
      this.process.kill('SIGTERM');
      this.process = null;
      this.isReady = false;
    }
  }
}

// Initialize the persistent server
const emotionServer = PersistentEmotionServer.getInstance();

// Cleanup on process exit
process.on('exit', () => emotionServer.shutdown());
process.on('SIGINT', () => emotionServer.shutdown());
process.on('SIGTERM', () => emotionServer.shutdown());

export async function detectEmotionFromText(text: string, language: 'en' | 'ur' = 'en'): Promise<EmotionResult> {
  try {
    if (!text || text.trim().length === 0) {
      return { emotion: 'neutral', confidence: 0.5, context: [] };
    }

    console.log(`⚡ Phase 4 Fast Text Emotion with Context: Processing "${text.substring(0, 50)}..." (${language})`);

    const request = {
      mode: 'text_with_context',  // New mode for context extraction
      text: text,
      language: language
    };

    const result = await emotionServer.sendRequest(request);
    
    console.log(`✅ Phase 4 Fast Text Emotion: ${result.emotion} (${result.confidence.toFixed(3)}) with context: [${result.context?.join(', ') || 'no context'}]`);
    return result;

  } catch (error) {
    console.error('❌ Phase 4 Fast Text Emotion Error:', error);
    console.log('🔄 Falling back to keyword-based detection');
    return performKeywordBasedEmotionDetection(text, language);
  }
}

export async function detectEmotionFromAudio(audioPath: string): Promise<EmotionResult> {
  try {
    if (!audioPath || !fs.existsSync(audioPath)) {
      console.error('❌ Audio file not found for emotion detection');
      return { emotion: 'neutral', confidence: 0.5, error: 'Audio file not found' };
    }

    console.log(`⚡ Fast Voice Emotion: Processing ${audioPath}`);

    const request = {
      mode: 'voice',
      audio_path: audioPath
    };

    const result = await emotionServer.sendRequest(request);
    
    console.log(`✅ Fast Voice Emotion: ${result.emotion} (${result.confidence.toFixed(3)})`);
    return result;

  } catch (error) {
    console.error('❌ Fast Voice Emotion Error:', error);
    return { emotion: 'neutral', confidence: 0.5, error: String(error) };
  }
}

export async function detectCombinedEmotion(text: string, audioPath: string, language: 'en' | 'ur' = 'en'): Promise<CombinedEmotionResult> {
  try {
    console.log(`⚡ Fast Combined Emotion: Text + Voice analysis (${language})`);

    const request = {
      mode: 'combined',
      text: text,
      audio_path: audioPath,
      language: language
    };

    const result = await emotionServer.sendRequest(request);
    
    if (result.combined) {
      console.log(`✅ Fast Combined Emotion: ${result.combined.emotion} (${result.combined.confidence.toFixed(3)})`);
      return result as CombinedEmotionResult;
    } else {
      // Fallback if unexpected format
      const textResult = await detectEmotionFromText(text, language);
      const voiceResult = await detectEmotionFromAudio(audioPath);
      
      return {
        combined: {
          emotion: textResult.emotion,
          confidence: textResult.confidence * 0.8,
          text_emotion: textResult.emotion,
          voice_emotion: voiceResult.emotion,
          method: 'fallback_combined'
        },
        text: textResult,
        voice: voiceResult
      };
    }

  } catch (error: any) {
    console.error('❌ Fast Combined Emotion Error:', error);
    
    // Fallback to individual detection
    const textResult = await detectEmotionFromText(text, language);
    const voiceResult = await detectEmotionFromAudio(audioPath);
    
    return {
      combined: {
        emotion: textResult.emotion,
        confidence: textResult.confidence * 0.8,
        text_emotion: textResult.emotion,
        voice_emotion: voiceResult.emotion,
        error: error.message,
        method: 'error_fallback'
      },
      text: textResult,
      voice: voiceResult
    };
  }
}

// Fallback keyword-based emotion detection
function performKeywordBasedEmotionDetection(text: string, language: 'en' | 'ur'): EmotionResult {
  const lowerText = text.toLowerCase();
  
  // English keywords
  const englishKeywords = {
    stress: ['stress', 'stressed', 'pressure', 'overwhelmed', 'anxious', 'anxiety', 'worried', 'tense'],
    sadness: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'broken', 'lonely'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'rage'],
    joy: ['happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'fantastic', 'love'],
    fear: ['scared', 'afraid', 'terrified', 'nervous', 'panic', 'worried', 'frightened'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow']
  };
  
  // Urdu keywords  
  const urduKeywords = {
    stress: ['تناؤ', 'پریشان', 'مشکل', 'فکر', 'غم'],
    sadness: ['اداس', 'غمگین', 'رونا', 'دکھ'],
    anger: ['غصہ', 'ناراض', 'بہت غصہ'],
    joy: ['خوش', 'خوشی', 'بہت اچھا', 'حیرت انگیز'],
    fear: ['ڈر', 'خوف', 'گھبراہٹ']
  };
  
  const keywords = language === 'ur' ? urduKeywords : englishKeywords;
  
  // Extract basic context from text (simple word extraction for fallback)
  const words = text.split(/\s+/).filter(word => word.length > 3);
  const foundKeywords: string[] = [];
  let detectedEmotion = 'neutral';
  
  for (const [emotion, wordList] of Object.entries(keywords)) {
    for (const keyword of wordList) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
        detectedEmotion = emotion;
        break;
      }
    }
    if (detectedEmotion !== 'neutral') break;
  }
  
  // Create context from found keywords and important words
  const context = foundKeywords.length > 0 
    ? foundKeywords.concat(words.slice(0, 3)) 
    : words.slice(0, 5);
  
  return { 
    emotion: detectedEmotion, 
    confidence: detectedEmotion !== 'neutral' ? 0.7 : 0.5, 
    context: context,
    method: 'keyword_fallback' 
  };
}
