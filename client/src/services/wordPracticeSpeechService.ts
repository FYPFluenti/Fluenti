/**
 * Simple Word Practice Speech Service
 * Uses the same clean, reliable approach as Emotional Support
 * Completely separate from the complex childSpeechService
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
   * EXACT SAME transcription as Emotional Support - uses identical endpoint and format
   * This ensures 100% identical STT processing with Emotional Support
   */
  async transcribeAudio(audioBlob: Blob, targetWord?: string): Promise<WordPracticeSpeechResult> {
    try {
      console.log('🎤 Word Practice - Starting IDENTICAL STT to Emotional Support...');
      console.log('🎯 Target word:', targetWord);
      
      // Create form data EXACTLY like Emotional Support
      const formData = new FormData();
      formData.append('mode', 'voice'); // Same as Emotional Support
      formData.append('language', 'en'); // Same as Emotional Support
      formData.append('audio', audioBlob, 'voice.wav'); // Same filename as Emotional Support
      formData.append('requestTTS', 'false'); // Don't need TTS response, just transcription
      // Note: We don't send history or therapy context - just pure STT

      // Use EXACT SAME endpoint as Emotional Support
      const response = await fetch(`${this.baseUrl}/api/emotional-support`, {
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

      // Extract transcription from Emotional Support response format
      const result: WordPracticeSpeechResult = {
        text: data.transcription || '',
        confidence: 0.9, // Emotional Support doesn't return confidence, use default
        language: data.language || 'en',
        targetWord: targetWord, // We track our own target word
        method: 'emotional_support_stt' // Indicate we're using same STT as Emotional Support
      };

      console.log('✅ Word Practice IDENTICAL STT successful (same as Emotional Support):', {
        text: result.text,
        confidence: result.confidence,
        targetWord: result.targetWord,
        method: result.method
      });

      return result;

    } catch (error) {
      console.error('❌ Word Practice STT error:', error);
      throw new Error(`Word Practice transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const wordPracticeSpeechService = new WordPracticeSpeechService();