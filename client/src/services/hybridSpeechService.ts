// Hybrid Speech Recognition Service
// Combines fast Web Speech API with accurate Microsoft pronunciation assessment

import { microsoftSpeechService, MicrosoftSpeechResult } from './microsoftSpeechService';

export interface HybridSpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
  // Enhanced with Microsoft Speech data
  microsoftAssessment?: MicrosoftSpeechResult;
}

export interface HybridSpeechConfig {
  language: string;
  sampleRate: number;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onResult: (result: HybridSpeechResult) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  useMicrosoftAssessment?: boolean;
}

class HybridSpeechRecognition {
  private recognition: any;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isListening = false;
  private config: HybridSpeechConfig;
  private targetWord: string = '';

  constructor(config: HybridSpeechConfig) {
    this.config = config;
    this.initializeWebSpeechAPI();
  }

  setTargetWord(word: string) {
    this.targetWord = word.toLowerCase().trim();
    console.log(`🎯 Target word set to: "${this.targetWord}"`);
  }

  private initializeWebSpeechAPI() {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false; // Single result mode
        this.recognition.interimResults = false; // Only final results
        this.recognition.maxAlternatives = this.config.maxAlternatives;
        this.recognition.lang = this.config.language;
        
        // Remove grammar settings that cause errors
        // this.recognition.grammars = null; // This causes the error
        // this.recognition.serviceURI = null; // This is also not needed

        this.recognition.onresult = async (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence || 0.8;
          const isFinal = result.isFinal;

          console.log('🎙️ Web Speech Result:', {
            transcript,
            confidence,
            isFinal,
            targetWord: this.targetWord
          });

          // Get alternatives
          const alternatives = [];
          for (let i = 1; i < result.length && i < this.config.maxAlternatives; i++) {
            alternatives.push({
              transcript: result[i].transcript.trim(),
              confidence: result[i].confidence || 0.7
            });
          }

          let hybridResult: HybridSpeechResult = {
            transcript,
            confidence,
            isFinal,
            alternatives
          };

          // Add Microsoft Speech assessment if enabled and final result
          if (this.config.useMicrosoftAssessment && isFinal && this.targetWord) {
            try {
              console.log('🔬 Starting Microsoft pronunciation assessment...');
              
              // Stop Web Speech API microphone access before starting Microsoft Speech
              this.recognition.stop();
              
              // Wait a moment for microphone to be released
              await new Promise(resolve => setTimeout(resolve, 500));
              
              let microsoftResult = null;
              
              // Use direct microphone method (more reliable than blob)
              if (microsoftSpeechService.isAvailable()) {
                console.log('🎤 Using direct Microsoft Speech assessment...');
                microsoftResult = await microsoftSpeechService.assessPronunciationDirect(this.targetWord);
              }
                
              if (microsoftResult) {
                hybridResult.microsoftAssessment = microsoftResult;
                console.log('✅ Microsoft assessment completed:', {
                  pronunciationScore: microsoftResult.pronunciationScore,
                  isCorrect: microsoftResult.isCorrect
                });
              } else {
                console.warn('⚠️ Microsoft assessment failed');
              }
            } catch (error) {
              console.warn('⚠️ Microsoft assessment failed, using Web Speech only:', error);
            }
          }

          this.config.onResult(hybridResult);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          
          let errorMessage = 'Speech recognition error';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking louder.';
              break;
            case 'audio-capture':
              errorMessage = 'Audio capture failed. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          this.config.onError(errorMessage);
        };

        this.recognition.onstart = () => {
          this.isListening = true;
          this.config.onStart();
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.config.onEnd();
        };

        console.log('✅ Hybrid Speech Recognition initialized');
      } else {
        throw new Error('Web Speech API not supported');
      }
    } catch (error) {
      console.error('Error initializing Hybrid Speech Recognition:', error);
      this.config.onError('Failed to initialize speech recognition');
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    try {
      // Start audio recording for Microsoft Speech assessment
      if (this.config.useMicrosoftAssessment) {
        await this.startAudioRecording();
      }

      // Start Web Speech API recognition
      if (this.recognition) {
        console.log('🎤 Starting Hybrid Speech Recognition');
        this.recognition.start();
      } else {
        throw new Error('Speech recognition not initialized');
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      this.isListening = false;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          this.config.onError('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          this.config.onError('No microphone found. Please check your microphone connection.');
        } else {
          this.config.onError(`Failed to start speech recognition: ${error.message}`);
        }
      } else {
        this.config.onError('Failed to start speech recognition: Unknown error');
      }
    }
  }

  private async startAudioRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Microsoft Speech requires 16kHz
        } 
      });

      // Try different audio formats for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        mimeType = 'audio/webm;codecs=pcm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('🎵 Audio recording started for Microsoft Speech assessment with format:', mimeType);

    } catch (error) {
      console.warn('Failed to start audio recording for Microsoft assessment:', error);
    }
  }

  private async getRecordedAudio(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.audioChunks.length === 0) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      } else {
        // Already stopped, create blob immediately
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      }
    });
  }

  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    if (this.recognition) {
      this.recognition.stop();
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.isListening = false;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stopListening();
  }
}

// Enhanced Pronunciation Analyzer that works with both Web Speech and Microsoft results
class HybridPronunciationAnalyzer {
  static analyzePronunciation(
    target: string,
    attempt: string,
    confidence: number,
    alternatives?: Array<{ transcript: string; confidence: number }>,
    microsoftAssessment?: MicrosoftSpeechResult
  ): {
    accuracy: number;
    phonemeAccuracy: number[];
    suggestions: string[];
    isCorrect: boolean;
    detailedFeedback?: string;
    source: 'microsoft' | 'enhanced-local';
  } {
    // Prefer Microsoft Speech results if available
    if (microsoftAssessment) {
      console.log('📊 Using Microsoft Speech assessment results');
      return {
        accuracy: Math.round(microsoftAssessment.pronunciationScore),
        phonemeAccuracy: microsoftAssessment.phonemeDetails.map(p => Math.round(p.accuracy)),
        suggestions: microsoftAssessment.suggestions,
        isCorrect: microsoftAssessment.isCorrect,
        detailedFeedback: this.generateDetailedFeedback(microsoftAssessment),
        source: 'microsoft'
      };
    }

    // Fallback to enhanced local analysis
    console.log('📊 Using enhanced local pronunciation analysis');
    return this.analyzeWithEnhancedLocal(target, attempt, confidence, alternatives);
  }

  private static generateDetailedFeedback(assessment: MicrosoftSpeechResult): string {
    const parts = [];
    
    if (assessment.isCorrect) {
      parts.push(`Excellent pronunciation! (${Math.round(assessment.pronunciationScore)}%)`);
    } else {
      parts.push(`Good effort! Score: ${Math.round(assessment.pronunciationScore)}%`);
    }

    if (assessment.fluencyScore < 70) {
      parts.push('Try speaking more smoothly.');
    }

    if (assessment.completenessScore < 70) {
      parts.push('Make sure to pronounce the complete word.');
    }

    return parts.join(' ');
  }

  private static analyzeWithEnhancedLocal(
    target: string,
    attempt: string,
    confidence: number,
    alternatives?: Array<{ transcript: string; confidence: number }>
  ) {
    const targetLower = target.toLowerCase().trim();
    const attemptLower = attempt.toLowerCase().trim();

    // Exact match check
    if (targetLower === attemptLower) {
      return {
        accuracy: Math.max(Math.round(confidence * 100), 90),
        phonemeAccuracy: new Array(targetLower.length).fill(100),
        suggestions: ['Perfect pronunciation!'],
        isCorrect: true,
        source: 'enhanced-local' as const
      };
    }

    // Enhanced similarity calculation with multiple algorithms
    const levenshteinSim = this.calculateLevenshteinSimilarity(targetLower, attemptLower);
    const phoneticSim = this.calculatePhoneticSimilarity(targetLower, attemptLower);
    const variationCheck = this.checkCommonVariations(targetLower, attemptLower);
    
    // Weighted combination
    const overallSimilarity = Math.max(
      levenshteinSim * 0.4 + phoneticSim * 0.4 + variationCheck * 0.2,
      variationCheck
    );
    
    const finalAccuracy = Math.round(overallSimilarity * confidence * 100);
    const isCorrect = finalAccuracy >= 65; // Slightly higher threshold for local analysis

    return {
      accuracy: Math.max(finalAccuracy, 10),
      phonemeAccuracy: new Array(targetLower.length).fill(Math.max(finalAccuracy, 50)),
      suggestions: this.generateLocalSuggestions(targetLower, attemptLower, finalAccuracy),
      isCorrect,
      source: 'enhanced-local' as const
    };
  }

  private static calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static calculatePhoneticSimilarity(target: string, attempt: string): number {
    // Simple phonetic similarity based on vowel and consonant patterns
    const targetVowels = target.match(/[aeiou]/g)?.length || 0;
    const attemptVowels = attempt.match(/[aeiou]/g)?.length || 0;
    
    const vowelSimilarity = 1 - Math.abs(targetVowels - attemptVowels) / Math.max(targetVowels, attemptVowels, 1);
    
    const targetConsonants = target.replace(/[aeiou]/g, '');
    const attemptConsonants = attempt.replace(/[aeiou]/g, '');
    
    const consonantSimilarity = this.calculateLevenshteinSimilarity(targetConsonants, attemptConsonants);
    
    return (vowelSimilarity + consonantSimilarity) / 2;
  }

  private static checkCommonVariations(target: string, attempt: string): number {
    const variations: Record<string, string[]> = {
      'tree': ['three', 'free', 'tee', 'trees'],
      'sun': ['son', 'sung', 'some', 'suns'],
      'cat': ['cut', 'hat', 'bat', 'cats'],
      'dog': ['duck', 'bog', 'log', 'dogs'],
      'book': ['buck', 'look', 'took', 'books'],
      'ball': ['bowl', 'bell', 'wall', 'balls'],
      'car': ['card', 'bar', 'far', 'cars'],
      'house': ['mouse', 'horse', 'houses'],
      'water': ['what are', 'walter', 'waters'],
      'apple': ['app', 'apples', 'ample']
    };

    if (variations[target]?.includes(attempt) || variations[attempt]?.includes(target)) {
      return 0.85;
    }

    return 0;
  }

  private static generateLocalSuggestions(target: string, attempt: string, accuracy: number): string[] {
    const suggestions: string[] = [];

    if (accuracy >= 80) {
      suggestions.push('Great job! Almost perfect!');
    } else if (accuracy >= 60) {
      suggestions.push('Good try! Keep practicing!');
    } else {
      if (attempt.length < target.length) {
        suggestions.push('Try to say all the sounds in the word');
      }
      if (attempt.length > target.length) {
        suggestions.push('The word is shorter - say it more simply');
      }
      if (attempt.length === 0) {
        suggestions.push('Please try speaking the word out loud');
      }
    }

    return suggestions.length > 0 ? suggestions : ['Keep practicing - you can do it!'];
  }
}

export { HybridSpeechRecognition, HybridPronunciationAnalyzer };