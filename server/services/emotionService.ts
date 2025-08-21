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
  context?: string[];
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
  return new Promise((resolve, reject) => {
    try {
      if (!text || text.trim().length === 0) {
        resolve({ emotion: 'neutral', confidence: 0.5, context: [] });
        return;
      }

      console.log(`Phase 4 Text Emotion with Context: Processing "${text.substring(0, 50)}..." (${language})`);

      // Escape quotes and newlines in the text for Python code
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      
      const pythonCode = `
from transformers import pipeline
import spacy
import sys

try:
    # Load emotion detection pipeline
    pipe = pipeline("text-classification", model="SamLowe/roberta-base-go_emotions")
    result = pipe("${escapedText}")[0]
    
    # Load spaCy model for context extraction
    nlp = spacy.load("en_core_web_sm")
    doc = nlp("${escapedText}")
    
    # Extract context: entities and important words (nouns, verbs, adjectives)
    entities = [ent.text for ent in doc.ents]
    important_words = [token.lemma_ for token in doc if token.pos_ in ['NOUN', 'VERB', 'ADJ'] and not token.is_stop and len(token.text) > 2]
    context = list(set(entities + important_words))  # Remove duplicates
    
    # Format output: emotion,score,context1:context2:context3
    context_str = ':'.join(context) if context else ''
    print(f"{result['label']},{result['score']},{context_str}")
    
except Exception as e:
    print(f"neutral,0.5,error:{str(e)}")
    sys.exit(1)
      `;

      const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const python = spawn(pythonPath, ['-c', pythonCode]);

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        try {
          if (code !== 0) {
            console.error('Python emotion detection error:', errorOutput);
            resolve(performKeywordBasedEmotionDetection(text, language));
            return;
          }

          const outputLine = output.trim().split('\n').pop() || '';
          const [emotion, scoreStr, contextStr] = outputLine.split(',');
          
          const score = parseFloat(scoreStr) || 0.5;
          const context = contextStr ? contextStr.split(':').filter(c => c && c !== 'error') : [];
          
          console.log(`✅ Phase 4 Text Emotion Result: ${emotion} (${score}) with context: [${context.join(', ')}]`);
          
          resolve({ 
            emotion: emotion || 'neutral', 
            confidence: score, 
            context: context 
          });
        } catch (error) {
          console.error('Error parsing emotion detection result:', error);
          resolve(performKeywordBasedEmotionDetection(text, language));
        }
      });

      python.on('error', (error) => {
        console.error('Failed to spawn Python process:', error);
        resolve(performKeywordBasedEmotionDetection(text, language));
      });

    } catch (error) {
      console.error('Phase 4 Text Emotion Detection Error:', error);
      console.log('Falling back to keyword-based emotion detection');
      resolve(performKeywordBasedEmotionDetection(text, language));
    }
  });
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

// Phase 4: Keyword-based fallback for when Python/API fails (now includes context)
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
  
  // Check for emotion keywords and extract basic context
  const foundKeywords: string[] = [];
  let detectedEmotion = 'neutral';
  
  for (const [emotion, wordList] of Object.entries(keywords)) {
    for (const keyword of wordList) {
      if (lowercaseText.includes(keyword)) {
        foundKeywords.push(keyword);
        detectedEmotion = emotion;
        console.log(`Keyword-based emotion detected: ${emotion} (found: ${keyword})`);
        break;
      }
    }
    if (detectedEmotion !== 'neutral') break;
  }

  // Extract basic context from text (simple word extraction)
  const words = text.split(/\s+/).filter(word => word.length > 3);
  const context = foundKeywords.length > 0 ? foundKeywords.concat(words.slice(0, 3)) : words.slice(0, 5);
  
  return { 
    emotion: detectedEmotion, 
    confidence: detectedEmotion !== 'neutral' ? 0.7 : 0.5,
    context: context
  };
}
