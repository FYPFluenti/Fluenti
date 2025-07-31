import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, RotateCcw } from 'lucide-react';

interface ThreeAvatarProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onListen?: () => void;
  onReset?: () => void;
  message?: string;
  emotion?: string;
}

export function ThreeAvatar({
  isActive = false,
  isSpeaking = false,
  onSpeak,
  onListen,
  onReset,
  message,
  emotion = 'neutral'
}: ThreeAvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate avatar loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Get emotion-based styling
  const getEmotionStyle = (emotion: string) => {
    switch (emotion) {
      case 'happy':
        return 'from-green-400 to-blue-500';
      case 'calm':
        return 'from-blue-400 to-purple-500';
      case 'encouraging':
        return 'from-orange-400 to-pink-500';
      case 'excited':
        return 'from-pink-400 to-red-500';
      default:
        return 'from-primary to-secondary';
    }
  };

  return (
    <Card className="fluenti-card p-6 relative overflow-hidden">
      {/* AI Status */}
      <Badge 
        className={`absolute top-4 right-4 ${
          isActive ? 'bg-secondary' : 'bg-gray-400'
        } text-white flex items-center space-x-2`}
      >
        <div className={`w-2 h-2 rounded-full ${
          isActive ? 'bg-green-300 animate-pulse' : 'bg-gray-300'
        }`}></div>
        <span>{isActive ? 'AI Active' : 'AI Inactive'}</span>
      </Badge>

      {/* Avatar Container */}
      <div className="fluenti-avatar-container mb-6">
        <div 
          ref={avatarRef}
          className={`w-48 h-48 bg-gradient-to-br ${getEmotionStyle(emotion)} rounded-full flex items-center justify-center relative transition-all duration-300 ${
            isSpeaking ? 'avatar-talking scale-105' : ''
          } ${!isLoaded ? 'animate-pulse' : ''}`}
        >
          {/* Avatar placeholder - In production, this would be the Ready Player Me 3D avatar */}
          <div className="text-white text-6xl">
            {isLoaded ? '🤖' : '⏳'}
          </div>
          
          {/* Speech indicator */}
          {isSpeaking && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="speech-wave">
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="text-primary h-4 w-4" />
            <span className="font-medium text-gray-700">AI Avatar Says:</span>
          </div>
          <p className="text-gray-600">{message}</p>
        </div>
      )}

      {/* Avatar Controls */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          className="fluenti-button-primary text-sm py-2"
          onClick={onSpeak}
          disabled={!isActive}
        >
          <Volume2 className="mr-1 h-4 w-4" />
          Speak
        </Button>
        
        <Button
          className="fluenti-button-secondary text-sm py-2"
          onClick={onListen}
          disabled={!isActive}
        >
          <Mic className="mr-1 h-4 w-4" />
          Listen
        </Button>
        
        <Button
          variant="outline"
          className="text-sm py-2"
          onClick={onReset}
          disabled={!isActive}
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Integration Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-600">
          <strong>Development Note:</strong> This placeholder will be replaced with Ready Player Me 3D avatar integration in production.
        </p>
      </div>

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Avatar...</p>
          </div>
        </div>
      )}
    </Card>
  );
}
