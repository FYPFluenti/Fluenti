import React, { useEffect, useState } from 'react';
import { TherapyType } from '@/types/games/story-game';
import { SparkleIcon, FoxIcon } from './icons';

interface AnalysisResultScreenProps {
  title: string;
  feedback: string;
  therapyType: TherapyType;
  level: number;
  onProceed: () => void;
}

const MAX_LEVEL = 20;

const AnalysisResultScreen: React.FC<AnalysisResultScreenProps> = ({ title, feedback, therapyType, level, onProceed }) => {
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Effect to select the best available natural-sounding female voice
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

  // Effect to narrate the title and feedback when the component mounts and voice is ready
  useEffect(() => {
    if (selectedVoice && title && feedback) {
      window.speechSynthesis.cancel(); // Clear queue in case of re-renders
      const textToSpeak = `${title}. ${feedback}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.voice = selectedVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoice, title, feedback]);
  
  const therapyName = {
    pronunciation: 'Pronunciation',
    fluency: 'Fluency',
    dld: 'Language',
    social: 'Social',
    none: 'Speech',
  }[therapyType];

  const config = {
    pronunciation: {
      textColor: 'text-[--primary-dark]',
      bgColor: 'bg-[--primary-bg-light]',
      borderColor: 'border-[--primary]'
    },
    fluency: {
      textColor: 'text-blue-800',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300'
    },
    dld: {
      textColor: 'text-purple-800',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300'
    },
    social: {
      textColor: 'text-green-800',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    none: {
      textColor: 'text-[--secondary-dark]',
      bgColor: 'bg-[--secondary-light]',
      borderColor: 'border-[--secondary]'
    }
  }[therapyType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[--card-background] rounded-3xl shadow-2xl p-6 md:p-10 text-center animate-pop">
        <FoxIcon className="w-20 h-20 mx-auto text-[--primary] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-[--foreground]">Check-up Complete!</h1>
        
        <div className={`my-8 p-6 ${config.bgColor} border-2 ${config.borderColor} rounded-2xl`}>
            {level > 0 && therapyType !== 'social' && (
                <div className="mb-4">
                    <p className={`text-lg font-bold ${config.textColor}`}>{therapyName} Skill Level</p>
                    <p className={`text-5xl font-bold ${config.textColor}`}>{level} <span className="text-3xl opacity-70">/ {MAX_LEVEL}</span></p>
                </div>
            )}
            <h2 className={`text-2xl font-bold ${config.textColor} mb-2`}>{title}</h2>
            <p className="text-lg text-[--foreground] leading-relaxed">
                {feedback}
            </p>
        </div>

        <button 
            onClick={onProceed}
            className="w-full p-4 rounded-2xl text-white bg-[--primary] hover:bg-[--primary-dark] shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-3 text-2xl font-bold"
            aria-label="Continue to story"
        >
            <SparkleIcon className="w-8 h-8"/>
            <span>Let's Go!</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisResultScreen;