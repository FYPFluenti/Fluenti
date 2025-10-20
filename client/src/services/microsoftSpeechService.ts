// Microsoft Speech Service - Focused implementation for speech therapy
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface MicrosoftSpeechResult {
  transcript: string;
  confidence: number;
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  phonemeDetails: Array<{
    phoneme: string;
    accuracy: number;
  }>;
  isCorrect: boolean;
  suggestions: string[];
}

export class MicrosoftSpeechService {
  private speechConfig: SpeechSDK.SpeechConfig | null = null;
  private isInitialized = false;

  constructor() {
    console.log('🏗️ MicrosoftSpeechService constructor called');
    console.log('🔍 SpeechSDK availability:', {
      sdkExists: typeof SpeechSDK !== 'undefined',
      sdkType: typeof SpeechSDK,
      sdkKeys: typeof SpeechSDK !== 'undefined' ? Object.keys(SpeechSDK) : []
    });
    this.initialize();
    
    // If initial initialization failed, try force reinitialize after a delay
    if (!this.isInitialized) {
      console.log('🔄 Initial initialization failed, attempting force reinitialize...');
      setTimeout(() => {
        if (!this.isInitialized) { // Only retry if still not initialized
          this.forceReinitialize();
        }
      }, 2000); // Increased delay to 2 seconds
    }
  }

  private initialize() {
    console.log('🔧 Starting Microsoft Speech SDK initialization...');
    
    try {
      // For Vite, use import.meta.env only (process.env not available in browser)
      const key = import.meta.env.VITE_MICROSOFT_SPEECH_KEY || 
                  import.meta.env.REACT_APP_MICROSOFT_SPEECH_KEY;
      const region = import.meta.env.VITE_MICROSOFT_SPEECH_REGION || 
                     import.meta.env.REACT_APP_MICROSOFT_SPEECH_REGION;

      console.log('🔑 Microsoft Speech API Key check:', {
        keyPresent: !!key,
        keyLength: key?.length || 0,
        region: region,
        keyPrefix: key?.substring(0, 8) + '...',
        keyEnd: '...' + key?.substring(key?.length - 8),
        sdkVersion: 'Microsoft Speech SDK loaded',
        envCheck: {
          viteKey: !!import.meta.env.VITE_MICROSOFT_SPEECH_KEY,
          reactAppKey: !!import.meta.env.REACT_APP_MICROSOFT_SPEECH_KEY
        }
      });

      if (!key || key === 'your_speech_key_here' || key === 'paste_your_key_1_here') {
        console.warn('⚠️ Microsoft Speech API key not configured. Using fallback mode.');
        console.warn('Available env vars:', Object.keys(import.meta.env).filter(k => k.includes('SPEECH')));
        this.isInitialized = false;
        return;
      }

      if (!region) {
        console.warn('⚠️ Microsoft Speech region not configured. Using fallback mode.');
        this.isInitialized = false;
        return;
      }

      // Test if Speech SDK is available
      if (typeof SpeechSDK === 'undefined' || !SpeechSDK.SpeechConfig) {
        console.error('❌ Microsoft Speech SDK not loaded properly', {
          sdkExists: typeof SpeechSDK !== 'undefined',
          speechConfigExists: !!(SpeechSDK && SpeechSDK.SpeechConfig),
          sdkKeys: SpeechSDK ? Object.keys(SpeechSDK) : []
        });
        this.isInitialized = false;
        return;
      }

      console.log('✅ Microsoft Speech SDK found:', {
        speechConfig: !!SpeechSDK.SpeechConfig,
        audioConfig: !!SpeechSDK.AudioConfig,
        speechRecognizer: !!SpeechSDK.SpeechRecognizer,
        pronunciationAssessment: !!SpeechSDK.PronunciationAssessmentConfig
      });

      console.log('🔧 Creating SpeechConfig with key and region...');
      
      // Wrap the config creation in try-catch for better error handling
      try {
        this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        this.speechConfig.speechRecognitionLanguage = 'en-US';
        this.isInitialized = true;
        
        console.log('✅ Microsoft Speech SDK initialized successfully with region:', region);
      } catch (configError) {
        console.error('❌ Error creating SpeechConfig:', configError);
        this.isInitialized = false;
        // Don't throw here, just log and continue
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Microsoft Speech SDK:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      this.isInitialized = false;
      // Don't throw here, just set initialized to false
    }
  }

  isAvailable(): boolean {
    const available = this.isInitialized && this.speechConfig !== null;
    console.log('🔍 Microsoft Speech Service availability check:', {
      isInitialized: this.isInitialized,
      speechConfigExists: this.speechConfig !== null,
      available: available
    });
    return available;
  }

  // Test method to bypass environment variables and test SDK directly
  testSDKDirectly(): boolean {
    try {
      console.log('🧪 Testing Microsoft Speech SDK directly...');
      
      if (typeof SpeechSDK === 'undefined') {
        console.error('❌ SpeechSDK is undefined');
        return false;
      }
      
      if (!SpeechSDK.SpeechConfig) {
        console.error('❌ SpeechSDK.SpeechConfig is undefined');
        return false;
      }
      
      // Try to create a config with dummy values to test SDK
      const testConfig = SpeechSDK.SpeechConfig.fromSubscription('test-key', 'eastus');
      console.log('✅ SpeechSDK can create config objects');
      return true;
      
    } catch (error) {
      console.error('❌ Error testing SDK directly:', error);
      return false;
    }
  }

  // Force reinitialize for debugging
  forceReinitialize(): boolean {
    console.log('🔧 Force reinitializing Microsoft Speech Service...');
    
    try {
      const key = import.meta.env.VITE_MICROSOFT_SPEECH_KEY;
      const region = import.meta.env.VITE_MICROSOFT_SPEECH_REGION;
      
      console.log('🔑 Using environment variables:', {
        keyExists: !!key,
        keyLength: key?.length,
        region: region
      });
      
      if (!key) {
        console.error('❌ No VITE_MICROSOFT_SPEECH_KEY found');
        return false;
      }
      
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region || 'eastus');
      this.speechConfig.speechRecognitionLanguage = 'en-US';
      this.isInitialized = true;
      
      console.log('✅ Force reinitialization successful!');
      return true;
      
    } catch (error) {
      console.error('❌ Force reinitialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async assessPronunciationDirect(targetWord: string): Promise<MicrosoftSpeechResult | null> {
    if (!this.isAvailable()) {
      console.warn('🚫 Microsoft Speech SDK not available for direct assessment');
      return null;
    }

    try {
      console.log('🎤 Starting direct Microsoft Speech assessment for:', targetWord);

      // Request microphone permission and test audio levels
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          } 
        });
        
        // Test audio levels
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        console.log('✅ Microphone permission granted with audio context');
        
        // Stop test stream
        stream.getTracks().forEach(track => track.stop());
        await audioContext.close();
        
      } catch (permError) {
        console.error('❌ Microphone permission denied:', permError);
        throw new Error('Microphone access required for pronunciation assessment');
      }

      // Use microphone directly for better compatibility
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

      // Create pronunciation assessment config
      const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
        targetWord,
        SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
        SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
        true // enableMiscue
      );

      // Create speech recognizer
      const recognizer = new SpeechSDK.SpeechRecognizer(
        this.speechConfig!,
        audioConfig
      );

      // Add speech context for better recognition of target word
      try {
        const phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);
        phraseList.addPhrase(targetWord);
        phraseList.addPhrase(targetWord.toLowerCase());
        phraseList.addPhrase(targetWord.toUpperCase());
        console.log('✅ Added phrase hints for better recognition');
      } catch (phraseError) {
        console.warn('⚠️ Could not add phrase hints:', phraseError);
      }

      // Apply pronunciation assessment
      pronunciationConfig.applyTo(recognizer);

      console.log('🔧 Microsoft Speech recognizer configured, starting recognition...');
      console.log('🎯 Please say the word:', targetWord);

      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          console.warn('⏰ Microsoft Speech direct assessment timeout (15s)');
          recognizer.close();
          resolve(null);
        }, 15000); // Increased timeout to 15 seconds

        recognizer.recognizeOnceAsync(
          (result) => {
            clearTimeout(timeout);
            console.log('📡 Microsoft Speech recognition result received:', {
              reason: result.reason,
              reasonString: SpeechSDK.ResultReason[result.reason],
              text: result.text,
              errorDetails: result.errorDetails,
              resultId: result.resultId
            });
            
            try {
              if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
                const processedResult = this.processResult(result, pronunciationResult, targetWord);
                
                console.log('🎯 Microsoft Speech DIRECT Assessment SUCCESS:', {
                  targetWord,
                  transcript: result.text,
                  overallScore: pronunciationResult.pronunciationScore,
                  accuracy: pronunciationResult.accuracyScore,
                  fluency: pronunciationResult.fluencyScore,
                  completeness: pronunciationResult.completenessScore
                });

                recognizer.close();
                resolve(processedResult);
              } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
                console.warn('⚠️ No speech detected. Please speak louder and closer to the microphone.');
                recognizer.close();
                resolve(null);
              } else {
                console.warn('❌ Microsoft Speech direct recognition failed:', {
                  reason: result.reason,
                  reasonString: SpeechSDK.ResultReason[result.reason],
                  errorDetails: result.errorDetails
                });
                recognizer.close();
                resolve(null);
              }
            } catch (error) {
              console.error('💥 Error processing Microsoft Speech direct result:', error);
              recognizer.close();
              resolve(null);
            }
          },
          (error: any) => {
            clearTimeout(timeout);
            console.error('❌ Microsoft Speech direct recognition error:', {
              error: error,
              errorType: typeof error,
              errorMessage: error instanceof Error ? error.message : String(error)
            });
            recognizer.close();
            resolve(null);
          }
        );

        console.log('⏳ Microsoft Speech recognition started, waiting for result...');
        console.log('🗣️ Please speak the word clearly into your microphone');
      });

    } catch (error) {
      console.error('❌ Error in Microsoft Speech direct assessment setup:', {
        error: error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  async assessPronunciation(
    audioBlob: Blob, 
    targetWord: string
  ): Promise<MicrosoftSpeechResult | null> {
    if (!this.isAvailable()) {
      console.warn('Microsoft Speech SDK not available, skipping assessment');
      return null;
    }

    try {
      console.log('🎤 Processing audio for Microsoft Speech assessment:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        targetWord
      });

      // Try direct audio processing with proper format
      const audioBuffer = await this.blobToArrayBuffer(audioBlob);
      const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(audioBuffer as any);

      // Create pronunciation assessment config
      const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
        targetWord,
        SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
        SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
        true // enableMiscue
      );

      // Create speech recognizer
      const recognizer = new SpeechSDK.SpeechRecognizer(
        this.speechConfig!,
        audioConfig
      );

      // Apply pronunciation assessment
      pronunciationConfig.applyTo(recognizer);

      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          console.warn('⏰ Microsoft Speech assessment timeout');
          recognizer.close();
          resolve(null);
        }, 10000); // 10 second timeout

        recognizer.recognizeOnceAsync(
          (result) => {
            clearTimeout(timeout);
            try {
              if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
                const processedResult = this.processResult(result, pronunciationResult, targetWord);
                
                console.log('🎯 Microsoft Speech Assessment SUCCESS:', {
                  targetWord,
                  transcript: result.text,
                  overallScore: pronunciationResult.pronunciationScore,
                  accuracy: pronunciationResult.accuracyScore,
                  fluency: pronunciationResult.fluencyScore
                });

                recognizer.close();
                resolve(processedResult);
              } else {
                console.warn('❌ Microsoft Speech recognition failed:', {
                  reason: result.reason,
                  errorDetails: result.errorDetails
                });
                recognizer.close();
                resolve(null);
              }
            } catch (error) {
              console.error('Error processing Microsoft Speech result:', error);
              recognizer.close();
              resolve(null);
            }
          },
          (error) => {
            clearTimeout(timeout);
            console.error('❌ Microsoft Speech recognition error:', error);
            recognizer.close();
            resolve(null);
          }
        );
      });

    } catch (error) {
      console.error('❌ Error in Microsoft Speech assessment:', error);
      return null;
    }
  }

  private processResult(
    result: SpeechSDK.SpeechRecognitionResult,
    pronunciationResult: SpeechSDK.PronunciationAssessmentResult,
    targetWord: string
  ): MicrosoftSpeechResult {
    // Extract phoneme details
    const phonemeDetails: Array<{ phoneme: string; accuracy: number }> = [];
    
    try {
      if (pronunciationResult.detailResult?.Words) {
        pronunciationResult.detailResult.Words.forEach((word: any) => {
          if (word.Phonemes) {
            word.Phonemes.forEach((phoneme: any) => {
              phonemeDetails.push({
                phoneme: phoneme.Phoneme || phoneme.phoneme,
                accuracy: phoneme.PronunciationAssessment?.AccuracyScore || phoneme.accuracyScore || 0
              });
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not extract phoneme details:', error);
    }

    // Generate suggestions based on low-scoring phonemes
    const suggestions = this.generateSuggestions(
      targetWord,
      result.text || '',
      phonemeDetails,
      pronunciationResult
    );

    // Determine if pronunciation is correct (70% threshold for speech therapy)
    const isCorrect = pronunciationResult.pronunciationScore >= 70;

    return {
      transcript: result.text || '',
      confidence: result.properties?.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult) ? 0.9 : 0.7,
      pronunciationScore: pronunciationResult.pronunciationScore || 0,
      accuracyScore: pronunciationResult.accuracyScore || 0,
      fluencyScore: pronunciationResult.fluencyScore || 0,
      completenessScore: pronunciationResult.completenessScore || 0,
      phonemeDetails,
      isCorrect,
      suggestions
    };
  }

  private generateSuggestions(
    targetWord: string,
    transcript: string,
    phonemeDetails: Array<{ phoneme: string; accuracy: number }>,
    pronunciationResult: SpeechSDK.PronunciationAssessmentResult
  ): string[] {
    const suggestions: string[] = [];

    // Find problematic phonemes (accuracy < 60%)
    const problematicPhonemes = phonemeDetails
      .filter(p => p.accuracy < 60)
      .slice(0, 2); // Top 2 issues

    problematicPhonemes.forEach(phoneme => {
      suggestions.push(`Focus on the "${phoneme.phoneme}" sound`);
    });

    // Check fluency
    if (pronunciationResult.fluencyScore < 60) {
      suggestions.push('Try speaking more smoothly');
    }

    // Check completeness
    if (pronunciationResult.completenessScore < 60) {
      suggestions.push('Make sure to pronounce the complete word');
    }

    // Check if word was recognized correctly
    const transcriptLower = transcript.toLowerCase().trim();
    const targetLower = targetWord.toLowerCase().trim();
    
    if (transcriptLower !== targetLower && transcriptLower.length > 0) {
      suggestions.push(`Try saying "${targetWord}" more clearly`);
    }

    return suggestions.length > 0 ? suggestions : ['Great job! Keep practicing!'];
  }

  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  dispose() {
    // Cleanup if needed
    this.speechConfig = null;
    this.isInitialized = false;
  }
}

// Singleton instance
export const microsoftSpeechService = new MicrosoftSpeechService();