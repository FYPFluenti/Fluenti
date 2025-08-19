// Phase 3: Advanced Emotion Detection Service
// Text + Voice emotion detection using Python subprocess with open-source models
// - Text: roberta-base-go_emotions (27 emotions including stress/anxiety)
// - Voice: SenseVoiceSmall/wav2vec2 for SER (sadness/anger detection)
// Bilingual-ready (English first, Urdu extension)

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface EmotionResult {
  emotion: string;
  confidence: number;
  all_scores?: Record<string, number>;
  error?: string;
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

export async function detectEmotionFromText(text: string, language: 'en' | 'ur' = 'en'): Promise<EmotionResult> {
  try {
    if (!text || text.trim().length === 0) {
      return { emotion: 'neutral', confidence: 0.5 };
    }

    console.log(`Phase 3 Text Emotion: Processing "${text.substring(0, 50)}..." (${language})`);

    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'emotion_detector.py');

    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      console.error('Emotion detector script not found, using fallback');
      return performKeywordBasedEmotionDetection(text, language);
    }

    const result = await runPythonEmotionDetection(pythonPath, scriptPath, ['text', text, language]);
    
    console.log(`✅ Phase 3 Text Emotion Result: ${result.emotion} (${result.confidence})`);
    return result;

  } catch (error) {
    console.error('Phase 3 Text Emotion Detection Error:', error);
    console.log('Falling back to keyword-based emotion detection');
    return performKeywordBasedEmotionDetection(text, language);
  }
}

export async function detectEmotionFromAudio(audioPath: string): Promise<EmotionResult> {
  try {
    if (!audioPath || !fs.existsSync(audioPath)) {
      console.error('Audio file not found for emotion detection');
      return { emotion: 'neutral', confidence: 0.5, error: 'Audio file not found' };
    }

    console.log(`Phase 3 Voice Emotion: Processing audio from ${audioPath}`);

    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'emotion_detector.py');

    if (!fs.existsSync(scriptPath)) {
      console.error('Emotion detector script not found');
      return { emotion: 'neutral', confidence: 0.5, error: 'Script not found' };
    }

    const result = await runPythonEmotionDetection(pythonPath, scriptPath, ['voice', audioPath]);
    
    console.log(`✅ Phase 3 Voice Emotion Result: ${result.emotion} (${result.confidence})`);
    return result;

  } catch (error: any) {
    console.error('Phase 3 Voice Emotion Detection Error:', error);
    return { emotion: 'neutral', confidence: 0.5, error: error.message };
  }
}

export async function combineEmotions(
  text: string, 
  audioPath: string, 
  language: 'en' | 'ur' = 'en'
): Promise<CombinedEmotionResult> {
  try {
    console.log(`Phase 3 Combined Emotion: Text + Voice analysis (${language})`);

    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'emotion_detector.py');

    if (!fs.existsSync(scriptPath)) {
      console.error('Emotion detector script not found, using separate detection');
      const textResult = await detectEmotionFromText(text, language);
      const voiceResult = await detectEmotionFromAudio(audioPath);
      
      // Simple combination fallback
      const combinedEmotion = textResult.confidence > voiceResult.confidence ? textResult.emotion : voiceResult.emotion;
      const combinedConfidence = Math.max(textResult.confidence, voiceResult.confidence) * 0.8;
      
      return {
        combined: {
          emotion: combinedEmotion,
          confidence: combinedConfidence,
          text_emotion: textResult.emotion,
          voice_emotion: voiceResult.emotion,
          text_confidence: textResult.confidence,
          voice_confidence: voiceResult.confidence,
          weights: { text: 0.6, voice: 0.4 }
        },
        text: textResult,
        voice: voiceResult
      };
    }

    const result = await runPythonEmotionDetection(pythonPath, scriptPath, ['combined', text, audioPath, language]);
    
    // The Python script returns a comprehensive result object for combined mode
    if (typeof result === 'object' && 'combined' in result) {
      console.log(`✅ Phase 3 Combined Emotion: ${result.combined.emotion} (${result.combined.confidence})`);
      return result as CombinedEmotionResult;
    } else {
      // Fallback if result format is unexpected
      return {
        combined: result as EmotionResult,
        text: { emotion: 'unknown', confidence: 0.5 },
        voice: { emotion: 'unknown', confidence: 0.5 }
      };
    }

  } catch (error: any) {
    console.error('Phase 3 Combined Emotion Detection Error:', error);
    
    // Fallback to individual detection
    const textResult = await detectEmotionFromText(text, language);
    const voiceResult = await detectEmotionFromAudio(audioPath);
    
    return {
      combined: {
        emotion: textResult.emotion,
        confidence: textResult.confidence * 0.8,
        error: error.message
      },
      text: textResult,
      voice: voiceResult
    };
  }
}

async function runPythonEmotionDetection(pythonPath: string, scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(pythonPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages') }
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Find the JSON result in stdout (last valid JSON line)
          const lines = stdout.trim().split('\n');
          let jsonResult = null;
          
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              jsonResult = JSON.parse(lines[i]);
              break;
            } catch (e) {
              // Continue looking for valid JSON
            }
          }
          
          if (jsonResult) {
            resolve(jsonResult);
          } else {
            reject(new Error('No valid JSON output from Python script'));
          }
        } catch (error: any) {
          reject(new Error(`Failed to parse emotion detection result: ${error.message}`));
        }
      } else {
        reject(new Error(`Python emotion detection failed with code ${code}: ${stderr}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Failed to run emotion detection: ${error.message}`));
    });
  });
}

// Phase 3: Keyword-based fallback for when Python/API fails
function performKeywordBasedEmotionDetection(text: string, language: 'en' | 'ur'): EmotionResult {
  const lowercaseText = text.toLowerCase();
  
  // English emotion keywords
  const englishKeywords = {
    stress: ['stressed', 'stress', 'anxious', 'anxiety', 'worried', 'tension', 'pressure', 'overwhelmed', 'overwhelm'],
    sadness: ['sad', 'depressed', 'down', 'unhappy', 'blue', 'miserable', 'crying', 'cry', 'tears', 'weeping', 'upset', 'heartbroken', 'devastated', 'grief'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'rage', 'pissed', 'frustrated', 'livid'],
    fear: ['scared', 'afraid', 'terrified', 'frightened', 'nervous', 'panic', 'fearful', 'worried'],
    joy: ['happy', 'joyful', 'excited', 'cheerful', 'glad', 'delighted', 'ecstatic', 'thrilled', 'elated'],
    disgust: ['disgusted', 'revolted', 'sick', 'nauseated', 'repulsed', 'appalled'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered']
  };

  // Urdu emotion keywords (romanized and native script)
  const urduKeywords = {
    stress: ['pareshan', 'tension', 'pareshani', 'ghabra', 'پریشان', 'تناؤ'],
    sadness: ['udas', 'ghamgin', 'rona', 'افسوس', 'غمگین', 'اداس'],
    anger: ['gussa', 'naraz', 'غصہ', 'ناراض'],
    fear: ['dar', 'khauf', 'ڈر', 'خوف'],
    joy: ['khush', 'khushi', 'خوش', 'خوشی'],
    disgust: ['nafrat', 'نفرت'],
    surprise: ['hairan', 'حیران']
  };

  const keywords = language === 'ur' ? urduKeywords : englishKeywords;
  
  // Check for emotion keywords
  for (const [emotion, wordList] of Object.entries(keywords)) {
    for (const keyword of wordList) {
      if (lowercaseText.includes(keyword)) {
        console.log(`Keyword-based emotion detected: ${emotion} (found: ${keyword})`);
        return { emotion, confidence: 0.7 };
      }
    }
  }

  // Default to neutral
  return { emotion: 'neutral', confidence: 0.5 };
}
