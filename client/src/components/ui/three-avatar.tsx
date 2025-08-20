import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

interface ThreeAvatarProps {
  isListening?: boolean;
  onSpeak?: (text: string) => void;
  currentMessage?: string;
  language?: 'english' | 'urdu';
  className?: string;
  // Phase 4: New props for TTS integration
  audioBase64?: string; // TTS generated audio
  enableLipSync?: boolean; // Enable advanced lip-sync
  voiceModel?: 'browser' | 'coqui'; // Voice synthesis method
}

export function ThreeAvatar({ 
  isListening = false, 
  onSpeak, 
  currentMessage = '',
  language = 'english',
  className = '',
  // Phase 4: New props
  audioBase64,
  enableLipSync = true,
  voiceModel = 'browser'
}: ThreeAvatarProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [lipSyncIntensity, setLipSyncIntensity] = useState(0);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  // Phase 4: Enhanced TTS playback with lip-sync
  const playTTSAudio = (audioBase64: string) => {
    if (!isAudioEnabled) return;

    try {
      // Convert base64 to audio blob
      const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => {
        console.log('Phase 4 TTS: Audio loading started');
      };

      audio.oncanplay = () => {
        console.log('Phase 4 TTS: Audio can play');
        setIsSpeaking(true);
        startLipSync();
        audio.play().catch(console.error);
      };

      audio.onended = () => {
        console.log('Phase 4 TTS: Audio playback ended');
        setIsSpeaking(false);
        stopLipSync();
        URL.revokeObjectURL(audioUrl);
        onSpeak?.(currentMessage);
      };

      audio.onerror = (error) => {
        console.error('Phase 4 TTS: Audio playback error:', error);
        setIsSpeaking(false);
        stopLipSync();
        URL.revokeObjectURL(audioUrl);
        // Fallback to browser TTS
        speakWithBrowserTTS(currentMessage);
      };

    } catch (error) {
      console.error('Phase 4 TTS: Failed to play TTS audio:', error);
      // Fallback to browser TTS
      speakWithBrowserTTS(currentMessage);
    }
  };

  // Convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  // Original browser TTS method
  const speakWithBrowserTTS = (text: string) => {
    if (!speechSynthRef.current || !isAudioEnabled || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on prop
    utterance.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      startLipSync();
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      stopLipSync();
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      stopLipSync();
    };

    speechSynthRef.current.speak(utterance);
    onSpeak?.(text);
  };

  // Phase 4: Enhanced lip-sync animation
  const startLipSync = () => {
    if (!enableLipSync) return;

    stopLipSync(); // Clear any existing interval
    
    lipSyncIntervalRef.current = setInterval(() => {
      // Simulate more realistic lip movement patterns
      const intensity = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      setLipSyncIntensity(intensity);
    }, 150); // Update every 150ms for smooth animation
  };

  const stopLipSync = () => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    setLipSyncIntensity(0);
  };

  // Main speak function with TTS integration
  const speak = (text: string) => {
    if (!isAudioEnabled || !text.trim()) return;

    // Cancel any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }

    // Phase 4: Use TTS audio if available, otherwise fallback to browser TTS
    if (audioBase64 && voiceModel === 'coqui') {
      console.log('Phase 4: Using Coqui TTS audio');
      playTTSAudio(audioBase64);
    } else {
      console.log('Phase 4: Using browser TTS');
      speakWithBrowserTTS(text);
    }
  };

  useEffect(() => {
    if (currentMessage && isAudioEnabled) {
      speak(currentMessage);
    }
  }, [currentMessage, audioBase64, isAudioEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLipSync();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (!isAudioEnabled) {
      // Stop all audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      setIsSpeaking(false);
      stopLipSync();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 3D Avatar Container */}
      <div 
        ref={avatarRef}
        className={`w-64 h-64 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isSpeaking ? 'scale-105 shadow-lg' : 'scale-100'
        } ${
          isListening ? 'ring-4 ring-red-400 ring-opacity-75 animate-pulse' : ''
        }`}
      >
        {/* Avatar Face */}
        <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          {/* Eyes */}
          <div className="absolute top-16 left-12 w-4 h-4 bg-white rounded-full">
            <div className={`w-2 h-2 bg-gray-800 rounded-full transition-all duration-200 ${
              isSpeaking ? 'mt-1 ml-1' : 'mt-2 ml-1'
            }`}></div>
          </div>
          <div className="absolute top-16 right-12 w-4 h-4 bg-white rounded-full">
            <div className={`w-2 h-2 bg-gray-800 rounded-full transition-all duration-200 ${
              isSpeaking ? 'mt-1 ml-1' : 'mt-2 ml-1'
            }`}></div>
          </div>

          {/* Phase 4: Enhanced Mouth with Lip-sync */}
          <div 
            className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-150 bg-gray-800 rounded-full ${
              isSpeaking 
                ? `w-${Math.max(6, Math.floor(lipSyncIntensity * 12))} h-${Math.max(4, Math.floor(lipSyncIntensity * 8))}` 
                : 'w-6 h-3'
            }`}
            style={{
              // Dynamic sizing based on lip-sync intensity
              width: isSpeaking ? `${Math.max(24, lipSyncIntensity * 48)}px` : '24px',
              height: isSpeaking ? `${Math.max(16, lipSyncIntensity * 32)}px` : '12px',
              transform: `translate(-50%, ${isSpeaking ? lipSyncIntensity * 2 : 0}px)`
            }}
          >
            {/* Teeth/tongue effect for more realistic mouth */}
            {isSpeaking && lipSyncIntensity > 0.5 && (
              <div 
                className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-white rounded-full"
                style={{
                  width: `${lipSyncIntensity * 16}px`,
                  height: `${lipSyncIntensity * 8}px`
                }}
              ></div>
            )}
          </div>

          {/* Speaking Animation - Enhanced */}
          {isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
              {/* Additional ripple effect */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-blue-300/50 animate-pulse"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </>
          )}
        </div>

        {/* Listening Indicator */}
        {isListening && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Phase 4: Enhanced Audio Waves with Lip-sync */}
        {(isSpeaking || isListening) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-white/50 rounded-full animate-pulse`}
                  style={{
                    height: isSpeaking 
                      ? `${Math.max(8, lipSyncIntensity * 30 + Math.random() * 10)}px`
                      : `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: isSpeaking ? '0.3s' : '0.8s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 4: TTS Model Indicator */}
        {audioBase64 && voiceModel === 'coqui' && (
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAudio}
          className="flex items-center space-x-2"
        >
          {isAudioEnabled ? (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Audio Off</span>
            </>
          )}
        </Button>

        {/* Phase 4: Voice Model Toggle */}
        {audioBase64 && (
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center space-x-2 ${
              voiceModel === 'coqui' ? 'bg-green-100 border-green-300' : ''
            }`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs">AI Voice</span>
          </Button>
        )}
      </div>

      {/* Avatar Status */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {isSpeaking 
            ? `Speaking${voiceModel === 'coqui' ? ' (AI Voice)' : ''}...`
            : isListening 
              ? 'Listening...' 
              : 'Ready to help!'
          }
        </p>
        {currentMessage && (
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto truncate">
            "{currentMessage}"
          </p>
        )}
        
        {/* Phase 4: Lip-sync intensity indicator (debug) */}
        {process.env.NODE_ENV === 'development' && isSpeaking && (
          <div className="mt-2">
            <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto">
              <div 
                className="h-1 bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${lipSyncIntensity * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Lip-sync: {Math.round(lipSyncIntensity * 100)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreeAvatar;