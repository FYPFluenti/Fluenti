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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-white border border-orange-200 rounded-xl shadow-lg p-6 md:p-10">
        <FoxIcon className="w-20 h-20 mx-auto text-[#ff6b1d] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Welcome, Storyteller!</h1>
        <p className="text-gray-600 text-center mb-8 text-lg">Every great story needs a hero.</p>
        
        <h2 className="text-2xl font-bold text-[#ff6b1d] mb-6 text-center">Choose Your Hero</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHARACTERS.map((char) => {
            const isSelected = selectedCharacter?.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-[#ff6b1d] bg-orange-50 shadow-lg' 
                    : 'border-orange-200 bg-white hover:border-[#ff6b1d] hover:bg-orange-50 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <char.icon className="w-10 h-10 text-[#ff6b1d]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 text-left">{char.name}</h3>
                    <p className="text-gray-600 text-left">{char.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={handleSelect}
          disabled={!selectedCharacter}
          className="w-full max-w-sm mx-auto mt-8 border rounded-xl px-4 py-3 text-left shadow bg-gradient-to-r from-[#ff6b1d] to-orange-500 text-white border-[#ff6b1d] flex items-center justify-between hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div>
              <h3 className="text-base font-semibold">Let's Begin!</h3>
              <p className="text-sm text-white/90">Start your adventure</p>
            </div>
            <SparkleIcon className="w-5 h-5 flex-shrink-0"/>
        </button>
      </div>
    </div>
  );
};
export default CharacterSelectionScreen;