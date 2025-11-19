import React, { useState } from 'react';
import { Character } from '@/types/games/story-game';
import { LionIcon, NatureIcon, InventorIcon, CreateIcon, FoxIcon, SparkleIcon } from './icons';

const CHARACTERS: Character[] = [
    { id: 'leo', name: 'Leo the Lion', role: 'The Brave Leader', icon: LionIcon },
    { id: 'willow', name: 'Willow the Whisperer', role: 'The Nature Friend', icon: NatureIcon },
    { id: 'sparky', name: 'Sparky the Stargazer', role: 'The Curious Inventor', icon: InventorIcon },
    { id: 'custom', name: 'Create Your Own', role: 'Tell your own tale!', icon: CreateIcon },
];

interface CharacterSelectionScreenProps {
  onSelect: (character: Character) => void;
}

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({ onSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(CHARACTERS[0]);

  const handleSelect = () => {
    if (selectedCharacter) {
      onSelect(selectedCharacter);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-[--card-background] rounded-3xl shadow-2xl p-6 md:p-10 text-center">
        <FoxIcon className="w-20 h-20 mx-auto text-[--primary] mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-[--foreground]">Welcome, Storyteller!</h1>
        <p className="text-[--text-light] mt-2 mb-8 text-lg">Every great story needs a hero.</p>
        
        <h2 className="text-2xl font-bold text-[--primary] mb-6">Choose Your Hero</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHARACTERS.map((char) => {
            const isSelected = selectedCharacter?.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`p-4 rounded-2xl border-4 cursor-pointer transition-all duration-200 transform ${
                  isSelected 
                    ? 'border-[--primary] bg-[--primary-bg-light] scale-105 shadow-xl' 
                    : 'border-[--subtle-border] bg-white hover:border-[--primary-light] hover:bg-[--primary-bg-light]'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-[--primary-light] rounded-full flex items-center justify-center">
                    <char.icon className="w-10 h-10 text-[--primary-dark]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[--foreground] text-left">{char.name}</h3>
                    <p className="text-[--text-light] text-left">{char.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={handleSelect}
          disabled={!selectedCharacter}
          className="w-full mt-8 bg-[--primary] text-white font-bold text-2xl py-4 px-6 rounded-2xl shadow-lg hover:bg-[--primary-dark] transform hover:-translate-y-1 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
        >
            <SparkleIcon className="w-8 h-8"/>
            <span>Let's Begin!</span>
        </button>
      </div>
    </div>
  );
};
export default CharacterSelectionScreen;