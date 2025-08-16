import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(language: string = 'en-US'): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}