import React from 'react';
import { FoxIcon, SpeechBubbleIcon, UsersIcon, FluencyIcon, DldIcon } from './icons';

interface TherapySelectionScreenProps {
  onSelect: (group: 'pronunciation' | 'fluency' | 'dld' | 'social') => void;
}

const TherapySelectionScreen: React.FC<TherapySelectionScreenProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-[--card-background] rounded-3xl shadow-2xl p-6 md:p-10 text-center animate-pop">
        <FoxIcon className="w-20 h-20 mx-auto text-[--primary] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-[--foreground]">Choose Your Focus</h1>
        <p className="text-[--text-light] mt-2 mb-8 text-lg">What would you like to practice in our adventure today?</p>
        
        <div className="space-y-4">
          <button
            onClick={() => onSelect('pronunciation')}
            className="w-full p-4 rounded-2xl border-4 border-transparent bg-[--primary-bg-light] hover:border-[--primary] hover:scale-105 transition-all duration-300 transform flex items-center space-x-4 text-left"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-[--primary-light] rounded-full flex items-center justify-center">
                <SpeechBubbleIcon className="w-10 h-10 text-[--primary-dark]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[--foreground]">Pronunciation Practice</h2>
                <p className="text-[--text-light] mt-1 text-sm">Practice making tricky sounds clear and easy to understand.</p>
            </div>
          </button>
          
          <button
            onClick={() => onSelect('fluency')}
            className="w-full p-4 rounded-2xl border-4 border-transparent bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 transform flex items-center space-x-4 text-left"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <FluencyIcon className="w-10 h-10 text-blue-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[--foreground]">Fluency & Stuttering Practice</h2>
                <p className="text-[--text-light] mt-1 text-sm">Practice speaking smoothly and with confidence.</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('dld')}
            className="w-full p-4 rounded-2xl border-4 border-transparent bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all duration-300 transform flex items-center space-x-4 text-left"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                <DldIcon className="w-10 h-10 text-purple-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[--foreground]">Language Building Practice</h2>
                <p className="text-[--text-light] mt-1 text-sm">Practice building bigger sentences and telling detailed stories.</p>
            </div>
          </button>
          
          <div className="pt-4">
            <button
                onClick={() => onSelect('social')}
                className="w-full p-4 rounded-2xl border-4 border-transparent bg-[--secondary-light] hover:border-[--secondary] hover:scale-105 transition-all duration-300 transform flex items-center space-x-4 text-left"
            >
                <div className="flex-shrink-0 w-16 h-16 bg-[--secondary] rounded-full flex items-center justify-center">
                    <UsersIcon className="w-10 h-10 text-[--secondary-dark]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[--foreground]">Social Communication Practice</h2>
                    <p className="text-[--text-light] mt-1 text-sm">Practice understanding feelings, taking turns, and making friends.</p>
                </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapySelectionScreen;