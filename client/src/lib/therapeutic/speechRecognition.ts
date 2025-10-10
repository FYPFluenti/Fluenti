/**
 * Speech Recognition Utilities
 * Helper functions for browser-based speech recognition
 */

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

/**
 * Initialize speech recognition with browser API
 */
export const initializeSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): any | null => {
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = options.language || 'en-US';
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? false;
  recognition.maxAlternatives = options.maxAlternatives || 1;

  return recognition;
};

/**
 * Calculate pronunciation accuracy
 */
export const calculateAccuracy = (
  expected: string,
  actual: string
): number => {
  const normalizedExpected = expected.toLowerCase().trim();
  const normalizedActual = actual.toLowerCase().trim();

  if (normalizedExpected === normalizedActual) {
    return 100;
  }

  // Levenshtein distance for similarity
  const distance = levenshteinDistance(normalizedExpected, normalizedActual);
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length);
  const similarity = (1 - distance / maxLength) * 100;

  return Math.max(0, Math.round(similarity));
};

/**
 * Levenshtein distance algorithm
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

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
};

/**
 * Check if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
};

/**
 * Speech Recognition Service Class
 * Provides a complete service for speech recognition with pronunciation accuracy
 */
export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;
  }

  async startListening(
    expectedWord: string,
    onResult: (result: string, accuracy: number) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      const accuracy = this.calculatePronunciationAccuracy(expectedWord.toLowerCase(), result);
      onResult(result, accuracy);
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private calculatePronunciationAccuracy(expected: string, actual: string): number {
    // Simple pronunciation accuracy calculation
    // In production, use more sophisticated phoneme analysis
    
    if (expected === actual) return 100;
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(expected, actual);
    const maxLength = Math.max(expected.length, actual.length);
    const similarity = (maxLength - distance) / maxLength;
    
    return Math.round(similarity * 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
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
}
