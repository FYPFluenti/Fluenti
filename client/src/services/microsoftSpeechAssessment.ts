// Microsoft Speech SDK Pronunciation Assessment Service
// Free tier: 5 hours/month - perfect for speech therapy app

interface MicrosoftSpeechConfig {
  subscriptionKey: string;
  region: string;
}

export interface PronunciationResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  overallScore: number;
  phonemes: PhonemeResult[];
  words: WordResult[];
}

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
  offset: number;
  duration: number;
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  offset: number;
  duration: number;
}

export class MicrosoftSpeechAssessment {
  private config: MicrosoftSpeechConfig;

  constructor(config: MicrosoftSpeechConfig) {
    this.config = config;
  }

  async assessPronunciation(
    audioBlob: Blob,
    referenceText: string,
    language: string = 'en-US'
  ): Promise<PronunciationResult> {
    try {
      // Convert audio blob to base64
      const audioBuffer = await this.blobToArrayBuffer(audioBlob);
      const audioBase64 = this.arrayBufferToBase64(audioBuffer);

      // Call Microsoft Speech API
      const response = await fetch(`https://${this.config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'Content-Type': 'audio/wav',
          'Accept': 'application/json',
          'Pronunciation-Assessment': JSON.stringify({
            ReferenceText: referenceText,
            GradingSystem: 'HundredMark',
            Granularity: 'Phoneme',
            Dimension: 'Comprehensive'
          })
        },
        body: audioBuffer
      });

      if (!response.ok) {
        throw new Error(`Microsoft Speech API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseMicrosoftResult(result);

    } catch (error) {
      console.error('Microsoft Speech Assessment error:', error);
      throw new Error('Failed to assess pronunciation with Microsoft Speech API');
    }
  }

  private parseMicrosoftResult(result: any): PronunciationResult {
    const pronunciationAssessment = result.NBest?.[0]?.PronunciationAssessment;
    
    if (!pronunciationAssessment) {
      throw new Error('No pronunciation assessment data received');
    }

    return {
      accuracyScore: pronunciationAssessment.AccuracyScore || 0,
      fluencyScore: pronunciationAssessment.FluencyScore || 0,
      completenessScore: pronunciationAssessment.CompletenessScore || 0,
      overallScore: pronunciationAssessment.PronScore || 0,
      phonemes: this.extractPhonemes(result.NBest?.[0]?.Words || []),
      words: this.extractWords(result.NBest?.[0]?.Words || [])
    };
  }

  private extractPhonemes(words: any[]): PhonemeResult[] {
    const phonemes: PhonemeResult[] = [];
    
    words.forEach(word => {
      if (word.Phonemes) {
        word.Phonemes.forEach((phoneme: any) => {
          phonemes.push({
            phoneme: phoneme.Phoneme,
            accuracyScore: phoneme.PronunciationAssessment?.AccuracyScore || 0,
            offset: phoneme.Offset,
            duration: phoneme.Duration
          });
        });
      }
    });

    return phonemes;
  }

  private extractWords(words: any[]): WordResult[] {
    return words.map(word => ({
      word: word.Word,
      accuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
      errorType: word.PronunciationAssessment?.ErrorType || 'None',
      offset: word.Offset,
      duration: word.Duration
    }));
  }

  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }
}

// Usage example for speech therapy
export const createSpeechTherapyAssessment = () => {
  const microsoftSpeech = new MicrosoftSpeechAssessment({
    subscriptionKey: import.meta.env.VITE_MICROSOFT_SPEECH_KEY || import.meta.env.REACT_APP_MICROSOFT_SPEECH_KEY || '',
    region: import.meta.env.VITE_MICROSOFT_SPEECH_REGION || import.meta.env.REACT_APP_MICROSOFT_SPEECH_REGION || 'eastus'
  });

  return microsoftSpeech;
};