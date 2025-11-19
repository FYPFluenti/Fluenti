import React, { useState } from 'react';
import { Theme, THEMES, Character } from '@/types/games/story-game';
import { FoxIcon, SparkleIcon } from './icons';

interface StartScreenProps {
  onStart: (theme: Theme) => void;
  isLoading: boolean;
  character: Character | null;
  error?: string | null;
}

const THEME_COLORS: Record<Theme, { bg: string; text: string; border: string; selected: string }> = {
    'Fantasy Forest': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', selected: 'ring-green-400' },
    'Jungle Adventure': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', selected: 'ring-yellow-400' },
    'Space Quest': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500', selected: 'ring-indigo-400' },
    'Magical School': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500', selected: 'ring-purple-400' },
    'Custom Adventure': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500', selected: 'ring-orange-400' },
};

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading, character, error }) => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[--card-background] rounded-3xl shadow-2xl p-6 md:p-10 text-center transform transition-all hover:scale-101 duration-300">
        {character?.icon && <character.icon className="w-20 h-20 mx-auto text-[--primary] mb-4" />}
        <h1 className="text-4xl md:text-5xl font-bold text-[--foreground]">{character?.name}'s Story</h1>
        <p className="text-[--text-light] mt-2 mb-8 text-lg">Let's create an adventure together!</p>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[--primary] mb-4">Choose Your Adventure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const colors = THEME_COLORS[theme];
              const isSelected = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-base font-bold
                    ${ isSelected 
                      ? `${colors.bg} ${colors.text} ${colors.border} scale-105 shadow-lg ring-4 ${colors.selected}` 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                    }`
                  }
                >
                  {theme}
                </button>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={() => onStart(selectedTheme)}
          disabled={isLoading}
          className="w-full bg-[--primary] text-white font-bold text-2xl py-4 px-6 rounded-2xl shadow-lg hover:bg-[--primary-dark] transform hover:-translate-y-1 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
        >
          {isLoading ? (
            <>
              <span>Thinking...</span>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </>
          ) : (
            <>
              <SparkleIcon className="w-8 h-8"/>
              <span>Start Story!</span>
            </>
          )}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Oops! Something went wrong:</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-600">Please try again or select a different theme.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartScreen;