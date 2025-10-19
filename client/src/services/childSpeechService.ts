/**
 * Dedicated Child Speech Recognition Service for Word Practice Game
 * Uses server-side Whisper STT optimized for children's speech patterns
 */

export interface ChildSpeechResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
  targetWord?: string;
  method?: string;
}

export interface ChildSpeechConfig {
  maxDuration?: number;
  targetWord?: string;
  language?: string;
}

export class ChildSpeechService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Transcribe child speech using dedicated server-side STT
   */
  async transcribeAudio(audioBlob: Blob, targetWord?: string): Promise<ChildSpeechResult> {
    try {
      console.log('🎤 Starting Child Speech STT transcription...');
      console.log('🎯 Target word:', targetWord);
      
      // Create form data for server upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'child_speech.webm');
      if (targetWord) {
        formData.append('targetWord', targetWord);
      }
      formData.append('language', 'en');

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

      const result: ChildSpeechResult = {
        text: data.transcription || '',
        confidence: data.confidence || 0.8,
        language: data.language || 'en',
        targetWord: data.targetWord,
        method: data.method
      };

      console.log('✅ Child Speech STT successful:', {
        text: result.text,
        confidence: result.confidence,
        targetWord: result.targetWord,
        method: result.method
      });

      return result;

    } catch (error) {
      console.error('❌ Child Speech STT error:', error);
      throw new Error(`Child speech transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record audio from microphone and transcribe using child-optimized STT
   */
  async recordAndTranscribe(maxDuration: number = 8000, targetWord?: string): Promise<ChildSpeechResult> {
    return new Promise(async (resolve, reject) => {
      let stream: MediaStream | null = null;
      
      try {
        console.log('🎙️ Starting audio recording for Child Speech STT...');
        console.log('🎯 Target word:', targetWord);
        
        // ✅ CRITICAL: Check if TTS is currently speaking before recording
        if ('speechSynthesis' in window && speechSynthesis.speaking) {
          console.log('⚠️ Detected ongoing TTS - cancelling and waiting...');
          speechSynthesis.cancel();
          // Wait for TTS to fully stop
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported in this browser');
        }

        // Check for available audio devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioDevices = devices.filter(d => d.kind === 'audioinput');
          
          if (audioDevices.length === 0) {
            throw new Error('No microphone devices found');
          }
          
          console.log(`✅ Found ${audioDevices.length} audio input device(s) for child speech`);
        } catch (deviceError) {
          console.error('❌ Error enumerating devices:', deviceError);
        }
        
        // Request microphone access with child-optimized constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        }).catch((error) => {
          if (error.name === 'NotAllowedError') {
            throw new Error('Microphone permission denied. Please allow microphone access.');
          } else if (error.name === 'NotFoundError') {
            throw new Error('No microphone found. Please connect a microphone.');
          } else if (error.name === 'NotReadableError') {
            throw new Error('Microphone is already in use by another application.');
          } else {
            throw new Error(`Microphone access failed: ${error.message || 'Unknown error'}`);
          }
        });

        if (!stream) {
          throw new Error('Failed to get media stream');
        }

        // Log which device is being used
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('✅ Child Speech - Microphone access granted');
          console.log('🎤 Using device:', audioTrack.label);
        }

        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
          stream.getTracks().forEach(track => track.stop());
          throw new Error('MediaRecorder API not supported in this browser');
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            if (stream) {
              stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
            
            if (audioChunks.length === 0) {
              reject(new Error('No audio data recorded'));
              return;
            }

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            console.log('🎵 Child speech recorded, size:', audioBlob.size, 'bytes');

            const result = await this.transcribeAudio(audioBlob, targetWord);
            resolve(result);

          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.onerror = (error) => {
          if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          }
          reject(new Error(`Child speech recording failed: ${error}`));
        };

        // Child-optimized voice detection settings
        let silenceTimeout: NodeJS.Timeout | null = null;
        const silenceThreshold = 0.003; // Lower threshold for quieter child speech
        const silenceDuration = 1200; // Shorter duration for single words
        const warmupPeriod = 800; // Shorter warmup for children
        
        // Start recording
        mediaRecorder.start();
        console.log('🔴 Child Speech Recording started...');
        console.log('🎙️ Child Speech Settings:', {
          maxDuration: maxDuration + 'ms',
          silenceThreshold: silenceThreshold,
          silenceDuration: silenceDuration + 'ms',
          warmupPeriod: warmupPeriod + 'ms',
          targetWord: targetWord
        });
        
        let recordingStartTime = Date.now();
        let speechDetected = false;
        let maxVolumeInSession = 0;
        const minimumRecordingDuration = 1500; // Minimum for child speech
        
        // Create audio context for volume detection
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const checkVolume = () => {
          analyser.getByteTimeDomainData(dataArray);
          
          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = Math.abs(dataArray[i] - 128) / 128;
            sum += normalized;
          }
          const average = sum / dataArray.length;
          
          maxVolumeInSession = Math.max(maxVolumeInSession, average);
          
          // Detect child speech
          const speechVolumeThreshold = 0.008; // Lowered for child speech
          if (average > speechVolumeThreshold) {
            speechDetected = true;
            console.log(`🎤 CHILD SPEECH DETECTED! Volume: ${average.toFixed(4)}`);
          }
          
          // Skip silence detection during warmup
          const recordingTime = Date.now() - recordingStartTime;
          if (recordingTime < warmupPeriod) {
            if (mediaRecorder.state === 'recording') {
              requestAnimationFrame(checkVolume);
            }
            return;
          }
          
          // Ensure minimum recording duration for child speech
          if (recordingTime < minimumRecordingDuration) {
            if (mediaRecorder.state === 'recording') {
              requestAnimationFrame(checkVolume);
            }
            return;
          }
          
          if (average < silenceThreshold) {
            // Silence detected - start countdown
            if (!silenceTimeout && speechDetected) {
              console.log(`🔇 Child speech silence detected, stopping in ${silenceDuration}ms`);
              silenceTimeout = setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                  audioContext.close();
                  console.log('⏹️ Child speech recording stopped (silence)');
                }
              }, silenceDuration);
            }
          } else {
            // Voice detected - cancel silence timeout
            if (silenceTimeout) {
              clearTimeout(silenceTimeout);
              silenceTimeout = null;
            }
          }
          
          if (mediaRecorder.state === 'recording') {
            requestAnimationFrame(checkVolume);
          }
        };
        
        checkVolume();

        // Auto-stop after maxDuration (fallback)
        const maxTimeout = setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            audioContext.close();
            console.log('⏹️ Child speech recording stopped (timeout)');
          }
        }, maxDuration);

      } catch (error) {
        // Clean up stream if error occurs
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Child speech recording error:', errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }
}

// Export a default instance
export const childSpeechService = new ChildSpeechService();