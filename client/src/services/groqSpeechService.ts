import Groq from 'groq-sdk';

export interface GroqSpeechResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface GroqSpeechConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'verbose_json';
}

export class GroqSpeechService {
  private groq: Groq;
  private config: GroqSpeechConfig;

  constructor(config: GroqSpeechConfig) {
    this.config = {
      model: 'whisper-large-v3',
      temperature: 0,
      response_format: 'verbose_json',
      ...config
    };
    
    this.groq = new Groq({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true // Allow browser usage for client-side
    });
  }

  /**
   * Transcribe audio using Groq's Whisper API
   */
  async transcribeAudio(audioBlob: Blob): Promise<GroqSpeechResult> {
    try {
      console.log('🎤 Starting Groq Whisper transcription...');
      
      // Convert blob to File object (required by Groq SDK)
      const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
      
      const transcription = await this.groq.audio.transcriptions.create({
        file: audioFile,
        model: this.config.model!,
        temperature: this.config.temperature,
        response_format: this.config.response_format,
        language: 'en' // Specify English for speech therapy
      });

      let result: GroqSpeechResult;

      if (this.config.response_format === 'verbose_json') {
        // Parse verbose JSON response
        const verboseResult = transcription as any;
        result = {
          text: verboseResult.text || '',
          confidence: this.calculateConfidence(verboseResult),
          language: verboseResult.language || 'en',
          duration: verboseResult.duration || 0
        };
      } else {
        // Handle simple text response
        result = {
          text: typeof transcription === 'string' ? transcription : transcription.text || '',
          confidence: 0.9, // Default confidence for non-verbose responses
          language: 'en'
        };
      }

      console.log('✅ Groq transcription successful:', {
        text: result.text,
        confidence: result.confidence,
        duration: result.duration
      });

      return result;

    } catch (error) {
      console.error('❌ Groq transcription error:', error);
      throw new Error(`Groq transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate confidence score from verbose response
   */
  private calculateConfidence(verboseResult: any): number {
    // Groq's verbose response includes segments with confidence-like metrics
    if (verboseResult.segments && verboseResult.segments.length > 0) {
      // Average the "no_speech_prob" inverse as a confidence measure
      const avgConfidence = verboseResult.segments.reduce((sum: number, segment: any) => {
        // Higher no_speech_prob means lower confidence
        const confidence = Math.max(0, 1 - (segment.no_speech_prob || 0));
        return sum + confidence;
      }, 0) / verboseResult.segments.length;
      
      return Math.round(avgConfidence * 100) / 100;
    }
    
    // Default high confidence for successful transcriptions
    return 0.9;
  }

  /**
   * Record audio from microphone and transcribe using Groq
   */
  async recordAndTranscribe(maxDuration: number = 10000): Promise<GroqSpeechResult> {
    return new Promise(async (resolve, reject) => {
      let stream: MediaStream | null = null;
      
      try {
        console.log('🎙️ Starting audio recording for Groq transcription...');
        
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
          
          console.log(`✅ Found ${audioDevices.length} audio input device(s):`);
          audioDevices.forEach((device, index) => {
            const label = device.label || 'Unknown Device';
            const isStereoMix = label.toLowerCase().includes('stereo mix') || 
                               label.toLowerCase().includes('wave out') ||
                               label.toLowerCase().includes('what u hear');
            
            console.log(`  ${index + 1}. ${label} (${device.deviceId.substring(0, 12)}...) ${isStereoMix ? '⚠️ NOT A MICROPHONE' : ''}`);
          });
          
          // Warn if all devices are Stereo Mix
          const allStereoMix = audioDevices.every(d => {
            const label = d.label.toLowerCase();
            return label.includes('stereo mix') || 
                   label.includes('wave out') || 
                   label.includes('what u hear');
          });
          
          if (allStereoMix) {
            console.warn('⚠️⚠️⚠️ WARNING: All detected devices are system audio (Stereo Mix)!');
            console.warn('⚠️ This will record computer output, NOT your microphone!');
            console.warn('⚠️ Please enable your real microphone in Windows Sound Settings.');
            throw new Error('No real microphone found. Only "Stereo Mix" detected. Please enable your microphone in Windows Sound Settings → Recording tab.');
          }
        } catch (deviceError) {
          console.error('❌ Error enumerating devices:', deviceError);
          // Re-throw if it's our custom error
          if (deviceError instanceof Error && deviceError.message.includes('Stereo Mix')) {
            throw deviceError;
          }
          // Continue anyway for other errors - getUserMedia will provide a better error
        }
        
        // Request microphone access with constraints
        // Note: Without deviceId constraint, browser picks the DEFAULT device
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        }).catch((error) => {
          // Provide more specific error messages
          if (error.name === 'NotAllowedError') {
            throw new Error('Microphone permission denied. Please allow microphone access.');
          } else if (error.name === 'NotFoundError') {
            throw new Error('No microphone found. Please connect a microphone.');
          } else if (error.name === 'NotReadableError') {
            throw new Error('Microphone is already in use by another application.');
          } else if (error.name === 'OverconstrainedError') {
            throw new Error('Your microphone doesn\'t support the required audio settings.');
          } else {
            throw new Error(`Microphone access failed: ${error.message || 'Unknown error'}`);
          }
        });

        if (!stream) {
          throw new Error('Failed to get media stream');
        }

        // Log which device is actually being used
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('✅ Microphone access granted');
          console.log('🎤 Using device:', audioTrack.label);
          console.log('🎤 Device settings:', audioTrack.getSettings());
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
            console.log('🎵 Audio recorded, size:', audioBlob.size, 'bytes');

            const result = await this.transcribeAudio(audioBlob);
            resolve(result);

          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.onerror = (error) => {
          if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          }
          reject(new Error(`Recording failed: ${error}`));
        };

        // Start recording
        mediaRecorder.start();
        console.log('🔴 Recording started...');

        // Auto-stop after maxDuration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            console.log('⏹️ Recording stopped (timeout)');
          }
        }, maxDuration);

      } catch (error) {
        // Clean up stream if error occurs
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Recording error:', errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }

  /**
   * Start continuous listening (returns a controller to stop)
   */
  startContinuousListening(
    onResult: (result: GroqSpeechResult) => void,
    onError: (error: string) => void,
    chunkDuration: number = 3000
  ): { stop: () => void } {
    let isListening = false;
    let currentStream: MediaStream | null = null;

    const startListening = async () => {
      if (isListening) return;
      
      try {
        isListening = true;
        console.log('🎤 Starting continuous Groq listening...');
        
        // Get media stream for this session
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        
        const result = await this.recordAndTranscribe(chunkDuration);
        
        if (isListening) {
          onResult(result);
          
          // Continue listening if text was detected
          if (result.text.trim()) {
            setTimeout(startListening, 100); // Small delay before next chunk
          } else {
            setTimeout(startListening, 500); // Longer delay if no speech
          }
        }
        
      } catch (error) {
        if (isListening) {
          onError(error instanceof Error ? error.message : 'Continuous listening failed');
          setTimeout(startListening, 1000); // Retry after error
        }
      }
    };

    startListening();

    return {
      stop: () => {
        isListening = false;
        if (currentStream) {
          currentStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          currentStream = null;
        }
        console.log('⏹️ Continuous Groq listening stopped');
      }
    };
  }
}

// Export a default instance using environment variables
const config: GroqSpeechConfig = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  model: import.meta.env.VITE_GROQ_SPEECH_MODEL || 'whisper-large-v3',
  temperature: 0,
  response_format: 'verbose_json'
};

export const groqSpeechService = new GroqSpeechService(config);