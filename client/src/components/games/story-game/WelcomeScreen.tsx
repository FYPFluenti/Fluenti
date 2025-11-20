import React, { useState, useEffect } from 'react';
import { FoxIcon, SparkleIcon } from './icons';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  // Effect to select the best available voice
  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const voiceScores: Record<string, number> = {
        'Microsoft Aria Online (Natural) - English (United States)': 100,
        'Microsoft Jenny Online (Natural) - English (United States)': 100,
        'Google US English': 90,
        'Samantha': 85,
        'Alex': 80,
        'Microsoft Zira Desktop - English (United States)': 75,
        'Google UK English Female': 70,
      };

      const scoredVoices = voices
        .filter(v => v.lang.startsWith('en'))
        .map(voice => ({ voice, score: voiceScores[voice.name] || 0 + (voice.name.toLowerCase().includes('natural') ? 50 : 0) }))
        .sort((a, b) => b.score - a.score);

      setSelectedVoice(scoredVoices.length > 0 ? scoredVoices[0].voice : (voices.find(v => v.lang.startsWith('en')) || voices[0]));
    };

    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = setVoice;
    }

    return () => {
      speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleStart = () => {
    if (isNarrating) return;
    // Set narrating state immediately to prevent re-clicks and race conditions.
    setIsNarrating(true);

    const welcomeText = "Hello, and welcome to StoryBuilder! I'm so excited to create a magical adventure with you. Together, we'll build a wonderful story. Let's begin!";
    
    if (selectedVoice && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(welcomeText);
      utterance.voice = selectedVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        onStart(); // Proceed after narration. No need to set isNarrating to false, as the component will unmount.
      };
      utterance.onerror = () => {
        onStart(); // Proceed even if narration fails.
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis is not available
      onStart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-orange-200 rounded-xl shadow-lg p-6 md:p-10 text-center">
        <FoxIcon className="w-20 h-20 mx-auto text-[#ff6b1d] mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Hello, Storyteller!</h1>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          I'm so excited to create a magical adventure with you.
          Together, we'll use our voices to build a wonderful story,
          choose our heroes, and explore amazing new worlds!
        </p>
        
        <button 
            onClick={handleStart}
            disabled={isNarrating}
            className="w-full max-w-sm mx-auto border rounded-xl px-4 py-3 text-left shadow bg-gradient-to-r from-[#ff6b1d] to-orange-500 text-white border-[#ff6b1d] flex items-center justify-between hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div>
              <h3 className="text-base font-semibold">Let's Begin!</h3>
              <p className="text-sm text-white/90">Start your story adventure</p>
            </div>
            <SparkleIcon className="w-5 h-5 flex-shrink-0"/>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;