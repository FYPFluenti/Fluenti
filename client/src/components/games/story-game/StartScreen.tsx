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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-orange-200 rounded-xl shadow-lg p-6 md:p-10">
        {character?.icon && <character.icon className="w-20 h-20 mx-auto text-[#ff6b1d] mb-4" />}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">{character?.name}'s Story</h1>
        <p className="text-gray-600 text-center mb-8 text-lg">Let's create an adventure together!</p>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#ff6b1d] mb-4 text-center">Choose Your Adventure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const colors = THEME_COLORS[theme];
              const isSelected = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-4 rounded-xl border transition-all duration-200 text-base font-semibold
                    ${ isSelected 
                      ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg` 
                      : 'bg-white text-gray-800 border-orange-200 hover:border-[#ff6b1d] hover:bg-orange-50 hover:shadow-lg'
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
          className="w-full max-w-sm mx-auto border rounded-xl px-4 py-3 text-left shadow bg-gradient-to-r from-[#ff6b1d] to-orange-500 text-white border-[#ff6b1d] flex items-center justify-between hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div>
                <h3 className="text-base font-semibold">Thinking...</h3>
                <p className="text-sm text-white/90">Creating your story</p>
              </div>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-base font-semibold">Start Story!</h3>
                <p className="text-sm text-white/90">Begin your adventure</p>
              </div>
              <SparkleIcon className="w-5 h-5 flex-shrink-0"/>
            </>
          )}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
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