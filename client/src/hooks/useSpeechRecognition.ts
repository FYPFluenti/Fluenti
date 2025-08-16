import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  isRecording: boolean;
  audioBlob: Blob | null;
  startListening: () => void;
  stopListening: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  resetTranscript: () => void;
  sendAudioToBackend: (onResult?: (result: any) => void, blob?: Blob) => Promise<void>;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(language: string = 'en-US'): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopCallbackRef = useRef<((blob: Blob | null) => void) | null>(null);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Phase 2: MediaRecorder support check
  const isMediaRecorderSupported = typeof window !== 'undefined' && 
    'MediaRecorder' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true; // Enable interim results for better user experience
    
    // Handle Urdu language code - fallback to English if Urdu not supported
    let langCode = language;
    if (language === 'ur-PK') {
      // Try Urdu first, but have fallback ready
      console.log('Attempting Urdu speech recognition (ur-PK)');
      langCode = 'ur-PK';
    }
    
    recognition.lang = langCode;
    recognition.maxAlternatives = 3; // Get more alternatives for better accuracy

    recognition.onstart = () => {
      console.log(`Speech recognition started with language: ${langCode}`);
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      console.log('Speech recognition result received:', event.results);
      
      // Get the latest result
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      
      if (result && result[0]) {
        const speechToText = result[0].transcript;
        const confidence = result[0].confidence || 0.8;
        
        console.log(`Transcript: "${speechToText}", Confidence: ${confidence}, Final: ${result.isFinal}`);
        
        // Update transcript even for interim results, but prioritize final results
        setTranscript(speechToText);
        setConfidence(confidence);
        
        // If it's a final result, stop listening
        if (result.isFinal) {
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event);
      
      if (event.error === 'language-not-supported' && language === 'ur-PK') {
        setError('Urdu speech recognition not supported. Try typing in Urdu or switch to English mode.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Speech recognition failed: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isSupported, language]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Clear previous state
    setError(null);
    setTranscript('');
    setConfidence(0);
    
    try {
      console.log(`Starting speech recognition for language: ${language}`);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
    setAudioBlob(null);
  }, []);

  // Phase 2: MediaRecorder functions for high-quality audio capture
  const startRecording = useCallback(async () => {
    if (!isMediaRecorderSupported) {
      setError('Audio recording not supported in this browser');
      return;
    }

    try {
      console.log('Phase 2: Starting MediaRecorder for high-quality audio capture');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      // Use WebM format if supported, fallback to other formats
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = []; // Reset chunks array

      mediaRecorder.ondataavailable = (event) => {
        console.log(`Phase 2: Data available, size: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log(`Phase 2: MediaRecorder stopped, chunks: ${chunksRef.current.length}`);
        
        if (chunksRef.current.length === 0) {
          console.error('Phase 2: No audio chunks collected!');
          setError('No audio data recorded. Please try again.');
          setIsRecording(false);
          if (stopCallbackRef.current) {
            stopCallbackRef.current(null);
            stopCallbackRef.current = null;
          }
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        console.log(`Phase 2: Audio recording complete. Size: ${blob.size} bytes, Type: ${blob.type}`);
        
        if (blob.size === 0) {
          console.error('Phase 2: Empty audio blob created!');
          setError('Empty audio recording. Please try again.');
          setIsRecording(false);
          if (stopCallbackRef.current) {
            stopCallbackRef.current(null);
            stopCallbackRef.current = null;
          }
          return;
        }
        
        setAudioBlob(blob);
        setIsRecording(false);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Call the callback with the blob
        if (stopCallbackRef.current) {
          stopCallbackRef.current(blob);
          stopCallbackRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Phase 2: MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorder.onstart = () => {
        console.log('Phase 2: MediaRecorder started successfully');
        setIsRecording(true);
      };

      console.log(`Phase 2: Starting MediaRecorder with mime type: ${selectedMimeType}`);
      mediaRecorder.start(1000); // Collect data every 1 second
      setError(null);
      
    } catch (err) {
      console.error('Phase 2: Failed to start recording:', err);
      setError('Microphone access denied or not available');
    }
  }, [isMediaRecorderSupported]);

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve, reject) => {
      console.log('Phase 2: stopRecording called, current state:', { 
        isRecording, 
        mediaRecorderState: mediaRecorderRef.current?.state 
      });
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('Phase 2: Stopping MediaRecorder');
        
        // Set up callback to resolve promise when stop completes
        stopCallbackRef.current = (blob) => {
          console.log('Phase 2: Stop callback called with blob:', blob);
          resolve(blob);
        };
        
        // Set up error handler
        const handleError = (event: any) => {
          console.error('Phase 2: MediaRecorder error during stop:', event);
          stopCallbackRef.current = null;
          reject(new Error('Recording stop failed'));
        };
        
        mediaRecorderRef.current.addEventListener('error', handleError, { once: true });
        mediaRecorderRef.current.stop();
      } else {
        console.log('Phase 2: MediaRecorder not in recording state or null');
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [isRecording]);

  // Phase 2: Send recorded audio to backend for transcription
  const sendAudioToBackend = useCallback(async (onResult?: (result: any) => void, blob?: Blob) => {
    const targetBlob = blob || audioBlob;
    
    if (!targetBlob) {
      setError('No audio recorded. Please record audio first.');
      return;
    }

    try {
      console.log(`Phase 2: Sending audio to backend for transcription. Size: ${targetBlob.size} bytes`);
      
      const formData = new FormData();
      formData.append('audio', targetBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch('/api/emotional-support', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Phase 2: Backend transcription result:', result);
      
      // Update transcript with backend result
      if (result.transcription) {
        setTranscript(result.transcription);
        setConfidence(1.0); // Backend processing assumed high confidence
      }

      if (onResult) {
        onResult(result);
      }

    } catch (err) {
      console.error('Phase 2: Failed to send audio to backend:', err);
      setError('Failed to process audio. Please try again.');
    }
  }, [audioBlob, language]);

  return {
    isListening,
    isRecording,
    transcript,
    confidence,
    error,
    isSupported: isSupported || !!isMediaRecorderSupported,
    audioBlob,
    startListening,
    stopListening,
    startRecording,
    stopRecording,
    resetTranscript,
    sendAudioToBackend
  };
}