/**
 * Reliable Speech Service - Uses the same STT pipeline as emotional support
 * This provides a robust fallback chain: fastSTT -> localWhisper -> simpleSTT
 */

export interface ReliableSpeechResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
  method?: string; // Which STT method was used
}

export class ReliableSpeechService {
  private maxRecordingTime = 8000; // 8 seconds max
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  /**
   * Record audio from microphone and transcribe using reliable server-side STT
   */
  async recordAndTranscribe(maxDuration: number = 8000, targetWord?: string): Promise<ReliableSpeechResult> {
    console.log('🎤 Starting reliable speech recording...');
    console.log('🎯 Target word:', targetWord);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        // Reset audio chunks
        this.audioChunks = [];

        // Create MediaRecorder
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        // Handle data available
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        // Handle recording stop
        this.mediaRecorder.onstop = async () => {
          try {
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());

            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            console.log('🎵 Audio recorded, size:', audioBlob.size, 'bytes');

            if (audioBlob.size < 1000) {
              throw new Error('Recording too short or empty');
            }

            // Send to server for transcription using the same reliable STT pipeline
            const result = await this.transcribeWithServer(audioBlob, targetWord);
            resolve(result);

          } catch (error) {
            console.error('❌ Error processing recording:', error);
            reject(error);
          }
        };

        this.mediaRecorder.onerror = (error) => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error(`Recording failed: ${error}`));
        };

        // Start recording
        this.mediaRecorder.start();
        console.log('🔴 Recording started for', maxDuration, 'ms');

        // Set timeout to stop recording
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.log('⏹️ Stopping recording (timeout)');
            this.mediaRecorder.stop();
          }
        }, maxDuration);

      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        reject(error);
      }
    });
  }

  /**
   * Send audio to server for PURE transcription (NO therapy processing)
   */
  private async transcribeWithServer(audioBlob: Blob, targetWord?: string): Promise<ReliableSpeechResult> {
    try {
      console.log('📤 Sending audio to server for PURE STT transcription...');
      console.log('🎯 Target word context:', targetWord);

      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'speech.webm');
      formData.append('targetWord', targetWord || ''); // Add context for better accuracy
      formData.append('language', 'en');

      // Send to dedicated STT-only endpoint (NOT emotional support)
      const response = await fetch('/api/speech/transcribe-only', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include auth cookies
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      console.log('✅ Pure STT transcription successful:', result.transcription);
      console.log('🔧 STT method used:', result.method);

      return {
        text: result.transcription || '',
        confidence: result.confidence || 0.9,
        language: result.language || 'en',
        method: result.method || 'server-stt-chain'
      };

    } catch (error) {
      console.error('❌ Pure STT transcription failed:', error);
      throw new Error(`Reliable STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop current recording if active
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('⏹️ Manually stopping recording');
      this.mediaRecorder.stop();
    }
  }
}

// Export singleton instance
export const reliableSpeechService = new ReliableSpeechService();