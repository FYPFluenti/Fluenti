/**
 * IEMOCAP Speech-based Emotion Detection Service
 * Complements GoEmotions text analysis with speech tone/stress detection
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Get the directory using the server folder structure
const serverDir = path.resolve(process.cwd(), 'server');
const pythonDir = path.join(serverDir, 'python');

export interface IEMOCAPResult {
  emotion: string;
  confidence: number;
  speech_characteristics: {
    energy_level: number;
    stress_level: number;
    anxiety_level: number;
    pitch_variability: number;
    voice_stability: number;
    tempo_indicator: number;
    spectral_complexity: number;
    emotional_intensity: number;
  };
  tone: string;
  stress_detected: boolean;
  anxiety_detected: boolean;
  high_energy?: boolean;
  emotional_intensity?: number;
  method: string;
}

export interface CombinedEmotionResult {
  primary_emotion: string;
  confidence: number;
  text_emotion: string;
  speech_emotion: string;
  speech_characteristics: IEMOCAPResult['speech_characteristics'];
  stress_detected: boolean;
  anxiety_detected: boolean;
  tone_analysis: string;
  method: string;
}

class IEMOCAPEmotionService {
  private pythonScript: string;
  private isInitialized: boolean = false;

  constructor() {
    this.pythonScript = path.join(pythonDir, 'iemocap_emotion_detector.py');
  }

  /**
   * Initialize the IEMOCAP service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[IEMOCAP] 🎵 Initializing speech emotion detection...');
      
      // Check if Python script exists
      if (!fs.existsSync(this.pythonScript)) {
        console.error('[IEMOCAP] ❌ Python script not found:', this.pythonScript);
        return false;
      }

      this.isInitialized = true;
      console.log('[IEMOCAP] ✅ Speech emotion service initialized');
      return true;
    } catch (error) {
      console.error('[IEMOCAP] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Detect emotion from speech audio file
   */
  async detectSpeechEmotion(audioFilePath: string): Promise<IEMOCAPResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[IEMOCAP] 🎵 Analyzing speech emotion...');

        // Check if audio file exists
        if (!fs.existsSync(audioFilePath)) {
          throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        const pythonProcess = spawn('python', [this.pythonScript, audioFilePath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
          try {
            if (code !== 0) {
              console.error('[IEMOCAP] ❌ Python process error:', errorData);
              resolve(this.getDefaultResult());
              return;
            }

            const result = JSON.parse(outputData) as IEMOCAPResult;
            
            console.log(`[IEMOCAP] ✅ Speech emotion: ${result.emotion} (${result.confidence.toFixed(3)})`);
            console.log(`[IEMOCAP] 🎯 Stress: ${result.speech_characteristics.stress_level.toFixed(3)}, Anxiety: ${result.speech_characteristics.anxiety_level.toFixed(3)}`);
            
            resolve(result);
          } catch (parseError) {
            console.error('[IEMOCAP] ❌ Failed to parse result:', parseError);
            resolve(this.getDefaultResult());
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('[IEMOCAP] ❌ Process spawn error:', error);
          resolve(this.getDefaultResult());
        });

      } catch (error) {
        console.error('[IEMOCAP] ❌ Speech emotion detection failed:', error);
        resolve(this.getDefaultResult());
      }
    });
  }

  /**
   * Combine text emotion (GoEmotions) with speech emotion (IEMOCAP)
   */
  async combineEmotions(
    textEmotion: string,
    textConfidence: number,
    audioFilePath: string
  ): Promise<CombinedEmotionResult> {
    try {
      console.log('[IEMOCAP] 🔄 Combining text + speech emotion analysis...');

      // Get speech emotion analysis
      const speechResult = await this.detectSpeechEmotion(audioFilePath);

      // Combine emotions with weighted approach
      const combinedResult = this.weightedEmotionFusion(
        textEmotion,
        textConfidence,
        speechResult
      );

      console.log(`[IEMOCAP] ✅ Combined emotion: ${combinedResult.primary_emotion} (${combinedResult.confidence.toFixed(3)})`);
      console.log(`[IEMOCAP] 📊 Text: ${textEmotion}, Speech: ${speechResult.emotion}`);

      return combinedResult;
    } catch (error) {
      console.error('[IEMOCAP] ❌ Combined emotion analysis failed:', error);
      return this.getDefaultCombinedResult(textEmotion, textConfidence);
    }
  }

  /**
   * Intelligent fusion of text and speech emotions
   */
  private weightedEmotionFusion(
    textEmotion: string,
    textConfidence: number,
    speechResult: IEMOCAPResult
  ): CombinedEmotionResult {
    const speechEmotion = speechResult.emotion;
    const speechConfidence = speechResult.confidence;

    // Weight calculation based on confidence and stress/anxiety indicators
    let textWeight = textConfidence * 0.6; // Base text weight
    let speechWeight = speechConfidence * 0.4; // Base speech weight

    // Boost speech weight if stress/anxiety detected (more reliable for these)
    if (speechResult.stress_detected || speechResult.anxiety_detected) {
      speechWeight += 0.3;
      textWeight -= 0.2;
    }

    // Normalize weights
    const totalWeight = textWeight + speechWeight;
    textWeight = textWeight / totalWeight;
    speechWeight = speechWeight / totalWeight;

    // Determine primary emotion
    let primaryEmotion: string;
    let finalConfidence: number;

    if (textWeight > speechWeight) {
      primaryEmotion = textEmotion;
      finalConfidence = textConfidence * textWeight + speechConfidence * speechWeight;
    } else {
      primaryEmotion = speechEmotion;
      finalConfidence = speechConfidence * speechWeight + textConfidence * textWeight;
    }

    // Handle conflicting emotions
    if (this.areEmotionsConflicting(textEmotion, speechEmotion)) {
      // Use speech emotion for stress/anxiety, text for complex emotions
      if (speechResult.stress_detected || speechResult.anxiety_detected) {
        primaryEmotion = speechEmotion;
      } else {
        primaryEmotion = textEmotion;
      }
    }

    return {
      primary_emotion: primaryEmotion,
      confidence: Math.min(0.95, finalConfidence),
      text_emotion: textEmotion,
      speech_emotion: speechEmotion,
      speech_characteristics: speechResult.speech_characteristics,
      stress_detected: speechResult.stress_detected,
      anxiety_detected: speechResult.anxiety_detected,
      tone_analysis: speechResult.tone,
      method: 'iemocap_text_speech_fusion'
    };
  }

  /**
   * Check if text and speech emotions are conflicting
   */
  private areEmotionsConflicting(textEmotion: string, speechEmotion: string): boolean {
    const conflicts = [
      ['happy', 'sad'],
      ['joy', 'sadness'],
      ['excitement', 'fear'],
      ['calm', 'angry'],
      ['approval', 'disapproval']
    ];

    return conflicts.some(([e1, e2]) => 
      (textEmotion.includes(e1) && speechEmotion.includes(e2)) ||
      (textEmotion.includes(e2) && speechEmotion.includes(e1))
    );
  }

  /**
   * Default result for error cases
   */
  private getDefaultResult(): IEMOCAPResult {
    return {
      emotion: 'neutral',
      confidence: 0.1,
      speech_characteristics: {
        energy_level: 0.4,
        stress_level: 0.3,
        anxiety_level: 0.3,
        pitch_variability: 0.3,
        voice_stability: 0.5,
        tempo_indicator: 0.4,
        spectral_complexity: 0.3,
        emotional_intensity: 0.3
      },
      tone: 'neutral',
      stress_detected: false,
      anxiety_detected: false,
      high_energy: false,
      emotional_intensity: 0.3,
      method: 'iemocap_fallback'
    };
  }

  /**
   * Default combined result for error cases
   */
  private getDefaultCombinedResult(textEmotion: string, textConfidence: number): CombinedEmotionResult {
    return {
      primary_emotion: textEmotion,
      confidence: textConfidence * 0.7, // Reduced confidence due to missing speech analysis
      text_emotion: textEmotion,
      speech_emotion: 'neutral',
      speech_characteristics: {
        energy_level: 0.4,
        stress_level: 0.3,
        anxiety_level: 0.3,
        pitch_variability: 0.3,
        voice_stability: 0.5,
        tempo_indicator: 0.4,
        spectral_complexity: 0.3,
        emotional_intensity: 0.3
      },
      stress_detected: false,
      anxiety_detected: false,
      tone_analysis: 'neutral',
      method: 'text_only_fallback'
    };
  }
}

// Export singleton instance
export const iemocapService = new IEMOCAPEmotionService();
