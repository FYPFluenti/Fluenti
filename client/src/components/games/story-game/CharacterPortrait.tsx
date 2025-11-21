import React, { useEffect, useState, useRef } from 'react';
import { Character } from '@/types/games/story-game';
import { FantasyForestIcon, JungleAdventureIcon, SpaceQuestIcon, MagicalSchoolIcon, FoxIcon } from './icons';

interface CharacterPortraitProps {
  character?: Character | null;
  theme?: string | null;
  isListening?: boolean;
  isNarrating?: boolean;
  className?: string;
}

// Ready Player Me API Configuration

// Character to Ready Player Me Avatar ID mapping
// TODO: Generate avatars at https://readyplayer.me and replace these IDs
// Or use Ready Player Me API to generate characters dynamically
const CHARACTER_AVATAR_IDS: Record<string, string> = {
  // These are example IDs - replace with your actual generated avatar IDs
  // To generate: Go to https://readyplayer.me, create avatars for each character,
  // then copy the avatar ID from the URL (e.g., https://models.readyplayer.me/[AVATAR_ID].glb)
  'leo': '', // Add Leo's Ready Player Me avatar ID here
  'willow': '', // Add Willow's Ready Player Me avatar ID here
  'sparky': '', // Add Sparky's Ready Player Me avatar ID here
  'custom': '', // Add custom character's Ready Player Me avatar ID here
};

// Fallback avatar IDs from your existing codebase (if available)
const FALLBACK_AVATARS = {
  therapist: '68ab4a2c3f2023411197a0fa',
  professional: '68ab4ab5e05b84c2efb26767',
  casual: '68aa261a75e83eeb00564816',
};

// Get Ready Player Me render URL for character
const getReadyPlayerMeAvatarUrl = (character: Character | null | undefined): string | null => {
  if (!character) return null;

  // Use character-specific avatar ID if available, otherwise use fallback
  const characterAvatarId = CHARACTER_AVATAR_IDS[character.id];
  const avatarId = (characterAvatarId && characterAvatarId.trim() !== '') 
    ? characterAvatarId 
    : FALLBACK_AVATARS.therapist;
  
  if (!avatarId || avatarId.trim() === '') return null;

  // Use Ready Player Me's render API for headshot images
  return `https://render.readyplayer.me/render/${avatarId}.png?scene=headshot&width=512&height=512&quality=high`;
};

const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  character,
  theme,
  isListening = false,
  isNarrating = false,
  className = ''
}) => {
  const [isSmiling, setIsSmiling] = useState(false);
  const [expression, setExpression] = useState<'idle' | 'happy' | 'listening' | 'thinking'>('idle');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const smileTimeoutRef = useRef<number | null>(null);
  const lastStateRef = useRef({ isListening, isNarrating });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (smileTimeoutRef.current) {
        clearTimeout(smileTimeoutRef.current);
      }
    };
  }, []);

  // Handle expression changes and smiling based on state
  useEffect(() => {
    if (isListening && !lastStateRef.current.isListening) {
      setExpression('listening');
      // Smile when listening starts
      setIsSmiling(true);
      if (smileTimeoutRef.current) clearTimeout(smileTimeoutRef.current);
      smileTimeoutRef.current = window.setTimeout(() => setIsSmiling(false), 2000);
    } else if (isNarrating && !lastStateRef.current.isNarrating) {
      setExpression('thinking');
    } else if (!isListening && !isNarrating) {
      setExpression('idle');
      // Randomly smile when idle (20% chance every 3-5 seconds)
      const randomSmile = Math.random() > 0.8;
      if (randomSmile) {
        setIsSmiling(true);
        if (smileTimeoutRef.current) clearTimeout(smileTimeoutRef.current);
        smileTimeoutRef.current = window.setTimeout(() => setIsSmiling(false), 1500);
      }
    }

    lastStateRef.current = { isListening, isNarrating };
  }, [isListening, isNarrating]);

  const avatarUrl = getReadyPlayerMeAvatarUrl(character);

  // Reset image error when character changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [character?.id]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const getThemeIcon = (currentTheme: string | null | undefined) => {
    if (!currentTheme) {
      return <FoxIcon className="w-full h-full text-white" />;
    }
    
    switch(currentTheme) {
      case 'Fantasy Forest': 
        return <FantasyForestIcon className="w-full h-full text-white" />;
      case 'Jungle Adventure': 
        return <JungleAdventureIcon className="w-full h-full text-white" />;
      case 'Space Quest': 
        return <SpaceQuestIcon className="w-full h-full text-white" />;
      case 'Magical School': 
        return <MagicalSchoolIcon className="w-full h-full text-white" />;
      default: 
        return <FoxIcon className="w-full h-full text-white" />;
    }
  };

  const getPortraitStyles = () => {
    const baseStyles: React.CSSProperties = {
      transition: 'all 0.3s ease',
    };

    if (expression === 'listening') {
      return {
        ...baseStyles,
        animation: 'characterListening 1.5s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
      };
    } else if (expression === 'thinking') {
      return {
        ...baseStyles,
        animation: 'characterThinking 2s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
      };
    } else if (isSmiling) {
      return {
        ...baseStyles,
        animation: 'characterHappy 0.6s ease-in-out',
        boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
      };
    }

    return baseStyles;
  };

  return (
    <div 
      className={`
        relative
        w-14 h-14 md:w-16 md:h-16
        rounded-full
        flex items-center justify-center
        overflow-hidden
        z-20
        ${className}
        ${expression === 'listening' ? 'ring-2 ring-green-400' : ''}
        ${expression === 'thinking' ? 'ring-2 ring-yellow-400' : ''}
        ${isSmiling ? 'ring-2 ring-yellow-300' : ''}
      `}
      style={{
        background: expression === 'listening' 
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : expression === 'thinking'
          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
          : isSmiling
          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
          : 'linear-gradient(135deg, #ff6b1d, #ea580c)',
        ...getPortraitStyles(),
      }}
    >
      {/* Animated background glow */}
      {expression !== 'idle' && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{
            background: expression === 'listening' 
              ? 'radial-gradient(circle, #22c55e, transparent)'
              : 'radial-gradient(circle, #fbbf24, transparent)',
          }}
        />
      )}

      {/* Loading State */}
      {isLoading && !imageError && avatarUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 rounded-full z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Character Image/Icon */}
      <div className="relative z-10 w-full h-full flex items-center justify-center text-white overflow-hidden rounded-full">
        {avatarUrl && !imageError ? (
          // Ready Player Me Avatar Image
          <img
            src={avatarUrl}
            alt={character?.name || 'Character'}
            className={`
              w-full h-full 
              object-cover 
              rounded-full 
              transition-all duration-300
              ${expression === 'happy' || isSmiling ? 'scale-110' : ''}
              ${expression === 'listening' ? 'scale-105 animate-pulse' : ''}
              ${expression === 'thinking' ? 'scale-105' : ''}
              ${isLoading ? 'opacity-0' : 'opacity-100'}
            `}
            style={{
              objectPosition: 'center 30%', // Focus on face
              filter: expression === 'listening' 
                ? 'brightness(1.1) saturate(1.2)' 
                : expression === 'thinking'
                ? 'brightness(1.05) saturate(1.1)'
                : isSmiling
                ? 'brightness(1.05) saturate(1.1)'
                : 'brightness(1) saturate(1)',
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          // Fallback to character icon or theme icon
          <div className={`
            w-full h-full flex items-center justify-center
            transition-all duration-300
            ${expression === 'happy' || isSmiling ? 'scale-110' : ''}
            ${expression === 'listening' ? 'scale-105 animate-pulse' : ''}
            ${expression === 'thinking' ? 'scale-105' : ''}
          `}>
            {(() => {
              // Safely render character icon or theme icon
              if (character && character.icon && typeof character.icon === 'function') {
                try {
                  const IconComponent = character.icon;
                  return <IconComponent className="w-full h-full" />;
                } catch (error) {
                  console.error('Error rendering character icon:', error);
                  return getThemeIcon(theme);
                }
              }
              return getThemeIcon(theme);
            })()}
          </div>
        )}
      </div>

      {/* Expression indicators */}
      {expression === 'listening' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse flex items-center justify-center z-30">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
      
      {expression === 'thinking' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce flex items-center justify-center z-30">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {/* Smile effect overlay */}
      {isSmiling && (
        <svg 
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-25 w-10 h-4 pointer-events-none"
          viewBox="0 0 40 16"
          fill="none"
          style={{ opacity: 0.8 }}
        >
          <path 
            d="M5 12 Q20 18 35 12" 
            stroke="#FFFFFF" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
};

export default CharacterPortrait;

