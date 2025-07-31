import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

interface ThreeAvatarProps {
  isListening?: boolean;
  onSpeak?: (text: string) => void;
  currentMessage?: string;
  language?: 'english' | 'urdu';
  className?: string;
}

export function ThreeAvatar({ 
  isListening = false, 
  onSpeak, 
  currentMessage = '',
  language = 'english',
  className = ''
}: ThreeAvatarProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (text: string) => {
    if (!speechSynthRef.current || !isAudioEnabled || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on prop
    utterance.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current.speak(utterance);
    onSpeak?.(text);
  };

  useEffect(() => {
    if (currentMessage && isAudioEnabled) {
      speak(currentMessage);
    }
  }, [currentMessage, isAudioEnabled]);

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (!isAudioEnabled && speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
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

          {/* Mouth */}
          <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${
            isSpeaking 
              ? 'w-8 h-6 bg-gray-800 rounded-full' 
              : 'w-6 h-3 bg-gray-800 rounded-full'
          }`}></div>

          {/* Speaking Animation */}
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
          )}
        </div>

        {/* Listening Indicator */}
        {isListening && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Audio Waves */}
        {(isSpeaking || isListening) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-white/50 rounded-full animate-pulse`}
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s'
                  }}
                ></div>
              ))}
            </div>
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
      </div>

      {/* Avatar Status */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {isSpeaking 
            ? 'Speaking...' 
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
      </div>
    </div>
  );
}