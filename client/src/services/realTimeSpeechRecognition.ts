interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

interface SpeechRecognitionConfig {
  language: string;
  sampleRate: number;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onResult: (result: SpeechRecognitionResult) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

class RealTimeSpeechRecognition {
  private recognition: any;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private config: SpeechRecognitionConfig;
  private websocket: WebSocket | null = null;

  constructor(config: SpeechRecognitionConfig) {
    this.config = config;
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Always initialize Web Speech API first as the primary method
    this.initializeWebSpeechAPI();
    
    // Optionally try WebSocket-based recognition for enhanced features
    // (disabled for now since the server doesn't have speech recognition WebSocket endpoint)
    // if (this.supportsWebSocketRecognition()) {
    //   this.initializeWebSocketRecognition();
    // }
  }

  private supportsWebSocketRecognition(): boolean {
    // Currently disabled as we don't have a dedicated WebSocket speech recognition endpoint
    // The server has a general WebSocket at /ws but not specifically for speech recognition
    return false;
  }

  private initializeWebSocketRecognition() {
    // Initialize WebSocket connection to speech recognition service
    // This would connect to a server-side speech recognition service
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/speech-recognition`;
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket speech recognition connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          this.config.onResult({
            transcript: result.transcript,
            confidence: result.confidence,
            isFinal: result.is_final,
            alternatives: result.alternatives
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.config.onError('WebSocket connection failed');
        // Fallback to Web Speech API
        this.initializeWebSpeechAPI();
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket recognition:', error);
      this.initializeWebSpeechAPI();
    }
  }

  private initializeWebSpeechAPI() {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        console.log('Web Speech API initialized successfully');
        
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;
        this.recognition.lang = this.config.language;

        this.recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          // Web Speech API confidence can be undefined in some browsers, default to 0.8
          const confidence = result[0].confidence || 0.8;
          const isFinal = result.isFinal;

          console.log('🎙️ Speech Recognition Result:', {
            transcript,
            confidence,
            isFinal,
            rawConfidence: result[0].confidence
          });

          // Get alternatives if available
          const alternatives = [];
          for (let i = 1; i < result.length && i < this.config.maxAlternatives; i++) {
            alternatives.push({
              transcript: result[i].transcript,
              confidence: result[i].confidence || 0.7 // Default confidence for alternatives
            });
          }

          this.config.onResult({
            transcript,
            confidence,
            isFinal,
            alternatives
          });
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
      } else {
        console.warn('Web Speech API not supported in this browser');
        this.config.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    } catch (error) {
      console.error('Error initializing Web Speech API:', error);
      this.config.onError('Failed to initialize speech recognition');
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    try {
      // Check if Web Speech API is available
      if (this.recognition) {
        console.log('Starting Web Speech API recognition');
        this.isListening = true;
        this.config.onStart();
        this.recognition.start();
      } else if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.log('Starting WebSocket recognition');
        await this.startWebSocketListening();
      } else {
        // Try to reinitialize Web Speech API if it wasn't initialized
        this.initializeWebSpeechAPI();
        if (this.recognition) {
          console.log('Reinitialized and starting Web Speech API recognition');
          this.isListening = true;
          this.config.onStart();
          this.recognition.start();
        } else {
          throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        }
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      this.isListening = false;
      
      // More specific error messages
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

  private async startWebSocketListening(): Promise<void> {
    try {
      // Get user media for high-quality audio capture
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate || 16000
        } 
      });

      // Create audio context for processing
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate || 16000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create MediaRecorder for capturing audio data
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
          // Send audio data to WebSocket server
          this.websocket.send(event.data);
        }
      };

      this.mediaRecorder.start(100); // Send data every 100ms for real-time processing
      this.isListening = true;
      this.config.onStart();

    } catch (error) {
      console.error('Error starting WebSocket listening:', error);
      this.config.onError('Failed to access microphone for WebSocket recognition');
    }
  }

  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.recognition) {
      this.recognition.stop();
    }

    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ type: 'stop_recognition' }));
    }

    this.isListening = false;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stopListening();
    
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Enhanced pronunciation analysis
export class PronunciationAnalyzer {
  static analyzePronunciation(
    target: string, 
    attempt: string, 
    confidence: number,
    alternatives?: Array<{ transcript: string; confidence: number }>
  ): {
    accuracy: number;
    phonemeAccuracy: number[];
    suggestions: string[];
    isCorrect: boolean;
  } {
    const targetLower = target.toLowerCase().trim();
    const attemptLower = attempt.toLowerCase().trim();

    // Debug logging
    console.log('🔍 Pronunciation Analysis:', {
      target: targetLower,
      attempt: attemptLower,
      confidence: confidence,
      alternatives: alternatives,
      isExactMatch: targetLower === attemptLower
    });

    // Exact match check
    const isExactMatch = targetLower === attemptLower;
    if (isExactMatch) {
      console.log('✅ Exact match found!');
      return {
        accuracy: Math.max(Math.round(confidence * 100), 90), // Minimum 90% for exact matches
        phonemeAccuracy: new Array(targetLower.length).fill(100),
        suggestions: [],
        isCorrect: true
      };
    }

    // Check alternatives for better matches
    let bestMatch = { transcript: attemptLower, confidence };
    if (alternatives && alternatives.length > 0) {
      console.log('🔄 Checking alternatives:', alternatives);
      for (const alt of alternatives) {
        const altLower = alt.transcript.toLowerCase().trim();
        if (altLower === targetLower) {
          console.log('✅ Perfect match found in alternatives!');
          return {
            accuracy: Math.max(Math.round((alt.confidence || 0.8) * 100), 90),
            phonemeAccuracy: new Array(targetLower.length).fill(100),
            suggestions: [],
            isCorrect: true
          };
        }
        
        // Find closest alternative
        const similarity = this.calculatePhoneticSimilarity(targetLower, altLower);
        const currentSimilarity = this.calculatePhoneticSimilarity(targetLower, attemptLower);
        if (similarity > currentSimilarity) {
          bestMatch = { transcript: altLower, confidence: alt.confidence || 0.7 };
        }
      }
    }

    // Special handling for very close matches
    const directSimilarity = this.calculatePhoneticSimilarity(targetLower, attemptLower);
    console.log('📈 Direct similarity score:', directSimilarity);
    
    if (directSimilarity >= 0.85) {
      console.log('✅ Very close match detected (85%+ similarity)');
      return {
        accuracy: Math.max(Math.round(confidence * 100), 85),
        phonemeAccuracy: new Array(targetLower.length).fill(90),
        suggestions: [],
        isCorrect: true
      };
    }
    
    // Additional check for common speech recognition variations
    if (this.isCommonVariation(targetLower, attemptLower)) {
      console.log('✅ Common speech variation detected');
      return {
        accuracy: Math.max(Math.round(confidence * 100), 80),
        phonemeAccuracy: new Array(targetLower.length).fill(85),
        suggestions: [],
        isCorrect: true
      };
    }

    // Calculate phonetic similarity
    const phoneticSimilarity = this.calculatePhoneticSimilarity(targetLower, bestMatch.transcript);
    const finalAccuracy = Math.round(phoneticSimilarity * Math.max(bestMatch.confidence, 0.7) * 100);

    // Analyze individual phoneme accuracy
    const phonemeAccuracy = this.analyzePhonemeAccuracy(targetLower, bestMatch.transcript);

    // Generate pronunciation suggestions
    const suggestions = this.generatePronunciationSuggestions(targetLower, bestMatch.transcript, phonemeAccuracy);

    const result = {
      accuracy: Math.max(finalAccuracy, 10), // Minimum 10% for effort
      phonemeAccuracy,
      suggestions,
      isCorrect: finalAccuracy >= 60 // Lowered threshold from 70 to 60 for speech therapy
    };

    console.log('📊 Analysis Result:', {
      phoneticSimilarity: phoneticSimilarity,
      bestMatchConfidence: bestMatch.confidence,
      finalAccuracy: finalAccuracy,
      isCorrect: result.isCorrect,
      suggestions: suggestions
    });

    return result;
  }

  private static calculatePhoneticSimilarity(target: string, attempt: string): number {
    // Quick exact match check
    if (target === attempt) return 1.0;
    
    // Check for very close matches (allowing for minor variations)
    const normalizedTarget = target.replace(/[^a-z]/g, '');
    const normalizedAttempt = attempt.replace(/[^a-z]/g, '');
    
    if (normalizedTarget === normalizedAttempt) return 0.95;
    
    // Use Levenshtein distance for fuzzy matching (better for speech recognition)
    const similarity = this.calculateLevenshteinSimilarity(normalizedTarget, normalizedAttempt);
    
    // If similarity is very high, consider it a match
    if (similarity >= 0.8) return similarity;
    
    // Implement sophisticated phonetic similarity algorithm
    const targetPhonemes = this.extractPhonemes(target);
    const attemptPhonemes = this.extractPhonemes(attempt);
    
    const phonemeSimilarity = this.comparePhonemeSequences(targetPhonemes, attemptPhonemes);
    
    // Return the higher of the two similarity scores
    return Math.max(similarity, phonemeSimilarity);
  }

  private static calculateLevenshteinSimilarity(str1: string, str2: string): number {
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static isCommonVariation(target: string, attempt: string): boolean {
    // Common speech recognition variations and pronunciations
    const commonVariations: Record<string, string[]> = {
      'tree': ['three', 'free', 'tee', 'tree'],
      'sun': ['son', 'sung', 'some'],
      'cat': ['cut', 'hat', 'bat'],
      'dog': ['duck', 'bog'],
      'book': ['buck', 'look'],
      'ball': ['bowl', 'bell'],
      'car': ['card', 'bar'],
      'house': ['mouse', 'horse'],
      'water': ['what are', 'walter'],
      'apple': ['app', 'apples']
    };

    // Check if attempt is a known variation of target
    if (commonVariations[target]?.includes(attempt)) {
      return true;
    }

    // Check if target is a known variation of attempt  
    if (commonVariations[attempt]?.includes(target)) {
      return true;
    }

    // Check for partial matches (word contained in another)
    if (target.length >= 3 && attempt.includes(target)) {
      return true;
    }
    
    if (attempt.length >= 3 && target.includes(attempt)) {
      return true;
    }

    return false;
  }

  private static extractPhonemes(word: string): string[] {
    // Simplified phoneme extraction - in production, use a proper phonetic library
    return word.split('').filter(char => /[a-z]/.test(char));
  }

  private static comparePhonemeSequences(target: string[], attempt: string[]): number {
    const maxLength = Math.max(target.length, attempt.length);
    if (maxLength === 0) return 1;

    let matches = 0;
    const minLength = Math.min(target.length, attempt.length);

    // Count exact position matches
    for (let i = 0; i < minLength; i++) {
      if (target[i] === attempt[i]) {
        matches++;
      }
    }

    // Add partial credit for similar sounds
    for (let i = 0; i < minLength; i++) {
      if (target[i] !== attempt[i]) {
        if (this.areSimilarPhonemes(target[i], attempt[i])) {
          matches += 0.5;
        }
      }
    }

    return matches / maxLength;
  }

  private static areSimilarPhonemes(phoneme1: string, phoneme2: string): boolean {
    // Define phonetically similar sounds
    const similarGroups = [
      ['p', 'b'], ['t', 'd'], ['k', 'g'],
      ['f', 'v'], ['s', 'z'], ['th', 'dh'],
      ['ch', 'j'], ['r', 'l'], ['m', 'n']
    ];

    return similarGroups.some(group => 
      group.includes(phoneme1) && group.includes(phoneme2)
    );
  }

  private static analyzePhonemeAccuracy(target: string, attempt: string): number[] {
    const targetPhonemes = this.extractPhonemes(target);
    const attemptPhonemes = this.extractPhonemes(attempt);
    
    return targetPhonemes.map((targetPhoneme, index) => {
      if (index >= attemptPhonemes.length) return 0;
      
      const attemptPhoneme = attemptPhonemes[index];
      if (targetPhoneme === attemptPhoneme) return 100;
      if (this.areSimilarPhonemes(targetPhoneme, attemptPhoneme)) return 60;
      return 20;
    });
  }

  private static generatePronunciationSuggestions(target: string, attempt: string, phonemeAccuracy: number[]): string[] {
    const suggestions: string[] = [];
    
    // Find the most problematic phonemes
    const problematicIndices = phonemeAccuracy
      .map((accuracy, index) => ({ accuracy, index }))
      .filter(item => item.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 2); // Focus on top 2 issues

    for (const item of problematicIndices) {
      const targetPhoneme = target[item.index];
      suggestions.push(`Try focusing on the "${targetPhoneme}" sound`);
    }

    if (attempt.length < target.length) {
      suggestions.push('Try to pronounce all the sounds in the word');
    }

    if (attempt.length > target.length) {
      suggestions.push('The word is shorter than you said - try saying it more simply');
    }

    return suggestions;
  }
}

export { RealTimeSpeechRecognition };
export type { SpeechRecognitionResult, SpeechRecognitionConfig };