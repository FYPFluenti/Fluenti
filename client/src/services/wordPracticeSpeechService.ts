/**
 * Word Practice Speech Service
 * Uses dedicated /api/speech/child-transcribe endpoint
 * Same STT chain as Emotional Support but separate endpoint without therapy processing
 */

export interface WordPracticeSpeechResult {
  text: string;
  confidence: number;
  language?: string;
  targetWord?: string;
  method?: string;
}

export class WordPracticeSpeechService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Dedicated Child Speech STT for Word Practice Game
   * Uses the same STT chain as Emotional Support but through dedicated endpoint
   * NO therapy processing - pure STT only
   */
  async transcribeAudio(audioBlob: Blob, targetWord?: string): Promise<WordPracticeSpeechResult> {
    try {
      console.log('🎤 Word Practice - Starting dedicated Child Speech STT...');
      console.log('🎯 Target word:', targetWord);
      
      // Create form data for child-transcribe endpoint
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('language', 'en');
      if (targetWord) {
        formData.append('targetWord', targetWord);
      }

      // Use dedicated child speech endpoint (NOT emotional support)
      const response = await fetch(`${this.baseUrl}/api/speech/child-transcribe`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Use httpOnly cookies for auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      // Extract transcription from child-transcribe response format
      const result: WordPracticeSpeechResult = {
        text: data.transcription || '',
        confidence: data.confidence || 0.9,
        language: data.language || 'en',
        targetWord: data.targetWord || targetWord,
        method: data.method || 'child_speech_stt'
      };

      console.log('✅ Word Practice Child Speech STT successful:', {
        text: result.text,
        confidence: result.confidence,
        targetWord: result.targetWord,
        method: result.method
      });

      return result;

    } catch (error) {
      console.error('❌ Word Practice Child Speech STT error:', error);
      throw new Error(`Word Practice transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const wordPracticeSpeechService = new WordPracticeSpeechService();