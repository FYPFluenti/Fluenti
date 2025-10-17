// Enhanced Speech Recognition with Multiple API Support
// Combines Web Speech API with Microsoft Speech SDK for optimal results

import { MicrosoftSpeechAssessment, PronunciationResult } from './microsoftSpeechAssessment';

interface EnhancedSpeechConfig {
  language: string;
  sampleRate: number;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onResult: (result: EnhancedSpeechResult) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  usePronunciationAssessment?: boolean;
  microsoftSpeechConfig?: {
    subscriptionKey: string;
    region: string;
  };
}

interface EnhancedSpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
  pronunciationAssessment?: PronunciationResult;
}

export class EnhancedSpeechRecognitionService {
  private recognition: any;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isListening = false;
  private config: EnhancedSpeechConfig;
  private microsoftSpeech?: MicrosoftSpeechAssessment;
  private targetWord: string = '';

  constructor(config: EnhancedSpeechConfig) {
    this.config = config;
    
    if (config.usePronunciationAssessment && config.microsoftSpeechConfig) {
      this.microsoftSpeech = new MicrosoftSpeechAssessment(config.microsoftSpeechConfig);
    }
    
    this.initializeWebSpeechAPI();
  }

  setTargetWord(word: string) {
    this.targetWord = word;
  }

  private initializeWebSpeechAPI() {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;
        this.recognition.lang = this.config.language;

        this.recognition.onresult = async (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.8;
          const isFinal = result.isFinal;

          console.log('🎙️ Speech Recognition Result:', {
            transcript,
            confidence,
            isFinal,
            targetWord: this.targetWord
          });

          // Get alternatives
          const alternatives = [];
          for (let i = 1; i < result.length && i < this.config.maxAlternatives; i++) {
            alternatives.push({
              transcript: result[i].transcript,
              confidence: result[i].confidence || 0.7
            });
          }

          let enhancedResult: EnhancedSpeechResult = {
            transcript,
            confidence,
            isFinal,
            alternatives
          };

          // Add pronunciation assessment if enabled and we have a target word
          if (this.config.usePronunciationAssessment && this.microsoftSpeech && this.targetWord && isFinal) {
            try {
              console.log('🔍 Running pronunciation assessment...');
              const audioBlob = await this.getRecordedAudio();
              if (audioBlob) {
                const pronunciationResult = await this.microsoftSpeech.assessPronunciation(
                  audioBlob,
                  this.targetWord,
                  this.config.language
                );
                
                enhancedResult.pronunciationAssessment = pronunciationResult;
                console.log('📊 Pronunciation Assessment:', pronunciationResult);
              }
            } catch (error) {
              console.warn('Pronunciation assessment failed, using fallback:', error);
            }
          }

          this.config.onResult(enhancedResult);
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

        console.log('✅ Enhanced Speech Recognition initialized successfully');
      } else {
        console.warn('Web Speech API not supported in this browser');
        this.config.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    } catch (error) {
      console.error('Error initializing Enhanced Speech Recognition:', error);
      this.config.onError('Failed to initialize speech recognition');
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    try {
      // Start audio recording for pronunciation assessment
      if (this.config.usePronunciationAssessment) {
        await this.startAudioRecording();
      }

      if (this.recognition) {
        console.log('🎤 Starting Enhanced Speech Recognition');
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
        } else if (error.name === 'NotSupportedError') {
          this.config.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate || 16000
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('🎵 Audio recording started for pronunciation assessment');

    } catch (error) {
      console.warn('Failed to start audio recording:', error);
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

      this.mediaRecorder.stop();
      
      // Stop all tracks
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
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

    this.isListening = false;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stopListening();
  }
}

// Advanced Pronunciation Analysis with Microsoft Speech API results
export class AdvancedPronunciationAnalyzerService {
  static analyzePronunciation(
    target: string,
    attempt: string,
    confidence: number,
    pronunciationAssessment?: PronunciationResult,
    alternatives?: Array<{ transcript: string; confidence: number }>
  ): {
    accuracy: number;
    phonemeAccuracy: number[];
    suggestions: string[];
    isCorrect: boolean;
    detailedFeedback?: string;
  } {
    // If we have Microsoft Speech assessment, use that
    if (pronunciationAssessment) {
      return this.analyzeMicrosoftAssessment(target, pronunciationAssessment);
    }

    // Fallback to our enhanced analysis
    return this.analyzeWithFallback(target, attempt, confidence, alternatives);
  }

  private static analyzeMicrosoftAssessment(
    target: string,
    assessment: PronunciationResult
  ) {
    const isCorrect = assessment.overallScore >= 70; // 70% threshold for Microsoft scores
    
    const suggestions: string[] = [];
    let detailedFeedback = '';

    // Analyze phoneme errors
    const problematicPhonemes = assessment.phonemes
      .filter((p: any) => p.accuracyScore < 60)
      .slice(0, 2); // Top 2 issues

    problematicPhonemes.forEach((phoneme: any) => {
      suggestions.push(`Focus on the "${phoneme.phoneme}" sound`);
    });

    // Analyze word-level errors
    assessment.words.forEach((word: any) => {
      if (word.errorType === 'Mispronunciation') {
        detailedFeedback += `The word "${word.word}" needs work on pronunciation. `;
      } else if (word.errorType === 'Omission') {
        detailedFeedback += `You missed part of the word "${word.word}". `;
      }
    });

    if (assessment.fluencyScore < 70) {
      suggestions.push('Try speaking more smoothly and naturally');
    }

    if (assessment.completenessScore < 70) {
      suggestions.push('Make sure to say the complete word');
    }

    return {
      accuracy: Math.round(assessment.overallScore),
      phonemeAccuracy: assessment.phonemes.map((p: any) => Math.round(p.accuracyScore)),
      suggestions,
      isCorrect,
      detailedFeedback: detailedFeedback || 'Great pronunciation!'
    };
  }

  private static analyzeWithFallback(
    target: string,
    attempt: string,
    confidence: number,
    alternatives?: Array<{ transcript: string; confidence: number }>
  ) {
    // Use our existing enhanced analysis as fallback
    const targetLower = target.toLowerCase().trim();
    const attemptLower = attempt.toLowerCase().trim();

    if (targetLower === attemptLower) {
      return {
        accuracy: Math.max(Math.round(confidence * 100), 90),
        phonemeAccuracy: new Array(targetLower.length).fill(100),
        suggestions: [],
        isCorrect: true
      };
    }

    // Enhanced similarity calculation
    const similarity = this.calculateEnhancedSimilarity(targetLower, attemptLower);
    const finalAccuracy = Math.round(similarity * confidence * 100);

    return {
      accuracy: Math.max(finalAccuracy, 10),
      phonemeAccuracy: new Array(targetLower.length).fill(Math.max(finalAccuracy, 50)),
      suggestions: this.generateSuggestions(targetLower, attemptLower),
      isCorrect: finalAccuracy >= 60
    };
  }

  private static calculateEnhancedSimilarity(target: string, attempt: string): number {
    // Combination of multiple similarity algorithms
    const levenshtein = this.levenshteinSimilarity(target, attempt);
    const phonetic = this.phoneticSimilarity(target, attempt);
    const commonVariations = this.checkCommonVariations(target, attempt);

    // Weight the different approaches
    return Math.max(levenshtein * 0.4 + phonetic * 0.4 + commonVariations * 0.2, commonVariations);
  }

  private static levenshteinSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
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

  private static phoneticSimilarity(target: string, attempt: string): number {
    // Simplified phonetic similarity
    const targetSounds = target.replace(/[^aeiou]/g, '').length;
    const attemptSounds = attempt.replace(/[^aeiou]/g, '').length;
    
    const vowelSimilarity = 1 - Math.abs(targetSounds - attemptSounds) / Math.max(targetSounds, attemptSounds, 1);
    
    const consonantMatch = this.consonantSimilarity(target, attempt);
    
    return (vowelSimilarity + consonantMatch) / 2;
  }

  private static consonantSimilarity(target: string, attempt: string): number {
    const targetConsonants = target.replace(/[aeiou]/g, '');
    const attemptConsonants = attempt.replace(/[aeiou]/g, '');
    
    return this.levenshteinSimilarity(targetConsonants, attemptConsonants);
  }

  private static checkCommonVariations(target: string, attempt: string): number {
    const variations: Record<string, string[]> = {
      'tree': ['three', 'free', 'tee'],
      'sun': ['son', 'sung', 'some'],
      'cat': ['cut', 'hat', 'bat'],
      'dog': ['duck', 'bog', 'log'],
      'book': ['buck', 'look', 'took'],
      'ball': ['bowl', 'bell', 'wall'],
      'car': ['card', 'bar', 'far'],
      'house': ['mouse', 'horse'],
      'water': ['what are', 'walter'],
      'apple': ['app', 'apples']
    };

    if (variations[target]?.includes(attempt) || variations[attempt]?.includes(target)) {
      return 0.85; // High similarity for known variations
    }

    return 0;
  }

  private static generateSuggestions(target: string, attempt: string): string[] {
    const suggestions: string[] = [];
    
    if (attempt.length < target.length) {
      suggestions.push('Try to pronounce all the sounds in the word');
    }
    
    if (attempt.length > target.length) {
      suggestions.push('The word is shorter - try saying it more simply');
    }
    
    const vowelTarget = target.match(/[aeiou]/g)?.length || 0;
    const vowelAttempt = attempt.match(/[aeiou]/g)?.length || 0;
    
    if (vowelTarget !== vowelAttempt) {
      suggestions.push('Pay attention to the vowel sounds');
    }
    
    return suggestions.slice(0, 2); // Limit to 2 suggestions
  }
}

// Export types
export type { EnhancedSpeechResult, EnhancedSpeechConfig };