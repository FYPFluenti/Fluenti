import React, { useState, useEffect, useRef } from 'react';
import { CustomStoryInputs } from '@/types/games/story-game';
import { SparkleIcon, MicrophoneIcon, SpeakerIcon } from './icons';
import { getCustomStorySuggestions } from '@/services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface CustomAdventureScreenProps {
  onCreateStory: (inputs: CustomStoryInputs) => void;
  onAnswer: (step: 'characterName' | 'setting' | 'interest', value: string) => void;
  isLoading: boolean;
  customStoryInputs: CustomStoryInputs;
}

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognitionAPI) {
    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
}

const QUESTIONS: Record<'characterName' | 'setting' | 'interest', string> = {
    characterName: "First, who is the hero of your story?",
    setting: "Great! Now, where does this amazing story happen?",
    interest: "Awesome! What is their special power or hobby?",
};

const CustomAdventureScreen: React.FC<CustomAdventureScreenProps> = ({ onCreateStory, onAnswer, isLoading, customStoryInputs }) => {
  const { currentStep } = customStoryInputs;
  const [isListening, setIsListening] = useState(false);
  const [spokenQuestion, setSpokenQuestion] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [areSuggestionsVisible, setAreSuggestionsVisible] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const silenceTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    return () => {
        if (recognition) {
            recognition.stop();
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
    };
  }, []);

  // Effect to select the best available natural-sounding female voice
  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const voiceScores: Record<string, number> = {
        // Highest preference for known high-quality natural voices
        'Microsoft Aria Online (Natural) - English (United States)': 100,
        'Microsoft Jenny Online (Natural) - English (United States)': 100,
        'Google US English': 90,
        'Samantha': 85, // Common high-quality macOS voice
        'Alex': 80, // Another high-quality macOS voice
        'Microsoft Zira Desktop - English (United States)': 75,
        'Google UK English Female': 70,
      };

      const scoredVoices = voices
        .filter(v => v.lang.startsWith('en')) // Only consider English voices
        .map(voice => {
          let score = 0;
          if (voiceScores[voice.name]) {
            score += voiceScores[voice.name];
          }
          if (voice.name.includes('(Natural)')) {
            score += 50; // Big bonus for "Natural" voices on Edge
          }
          if (voice.name.includes('Female')) {
            score += 5; // Slight preference for female voices
          }
          if (voice.localService) {
            score += 5; // Prefer local voices as they are often higher quality and don't require network
          }
          if (voice.default) {
            score += 1; // Smallest preference for the default
          }
          return { voice, score };
        })
        .sort((a, b) => b.score - a.score); // Sort descending by score

      if (scoredVoices.length > 0) {
        setSelectedVoice(scoredVoices[0].voice);
      } else {
        // Fallback to the first available English voice if no matches
        setSelectedVoice(voices.find(v => v.lang.startsWith('en')) || voices[0]);
      }
    };

    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  const currentQuestion = currentStep !== 'done' ? QUESTIONS[currentStep] : "Let's create your story!";

  const speakText = (text: string, suggestionsToSpeak?: string[]) => {
    if ('speechSynthesis' in window && text && selectedVoice) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = 0.95; // Slightly slower for a more gentle, narrative pace
      utterance.pitch = 1.1; // Slightly higher pitch can sound more friendly and engaging
      
      utterance.onend = () => {
        setAreSuggestionsVisible(true);
        if (suggestionsToSpeak && suggestionsToSpeak.length > 0) {
            const suggestionsText = `How about: ${suggestionsToSpeak.join(', or ')}?`;
            const suggestionsUtterance = new SpeechSynthesisUtterance(suggestionsText);
            suggestionsUtterance.voice = selectedVoice;
            suggestionsUtterance.rate = 0.95;
            suggestionsUtterance.pitch = 1.1;
            window.speechSynthesis.speak(suggestionsUtterance);
        }
      };

      window.speechSynthesis.speak(utterance);
      setSpokenQuestion(text);
    }
  };

  useEffect(() => {
    if (currentStep === 'done') {
      onCreateStory(customStoryInputs);
      return;
    }

    // Reset state for the new step
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    setAreSuggestionsVisible(false);
    setSpokenQuestion(''); // Reset spoken state for new question

    const fetchAndSpeak = async () => {
      try {
        const newSuggestions = await getCustomStorySuggestions(currentStep, customStoryInputs);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    
    fetchAndSpeak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);
  
  // Separate effect to trigger speech when all conditions are met
  useEffect(() => {
    // Conditions: Not done, voice is loaded, suggestions are loaded (or fetch failed), and we haven't spoken the current question yet.
    if (currentStep !== 'done' && selectedVoice && !isLoadingSuggestions && spokenQuestion !== currentQuestion) {
      speakText(currentQuestion, suggestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, isLoadingSuggestions, suggestions, currentStep]);


  const handleListen = () => {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser.');
        return;
    }
    if (isListening || isLoading || isLoadingSuggestions) return;

    transcriptRef.current = '';
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
    }

    recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = fullTranscript;

        silenceTimerRef.current = window.setTimeout(() => {
            if (recognition) {
              recognition.stop();
            }
        }, 1500); // 1.5 second timeout to determine end of speech
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      const finalTranscript = transcriptRef.current.trim();
      if (finalTranscript && currentStep !== 'done') {
        onAnswer(currentStep, finalTranscript);
      }
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };

    setIsListening(true);
    recognition.start();
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (currentStep !== 'done') {
        onAnswer(currentStep, suggestion);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-orange-200 rounded-xl shadow-lg p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Create Your Own Adventure!</h1>
        <p className="text-gray-600 text-center mb-8 text-lg">Let's build a story together. Just answer my questions!</p>
        
        <div className="my-8 min-h-[80px]">
          {(isLoading || (currentStep === 'done' && isLoading)) ? (
             <LoadingSpinner />
          ) : (
            <p className="text-2xl font-bold text-[#ff6b1d] text-center">{currentQuestion}</p>
          )}
        </div>
        
        {areSuggestionsVisible && suggestions.length > 0 && !isLoading && (
             <div className="mb-6 flex flex-wrap justify-center gap-3">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="font-semibold py-2 px-4 rounded-xl border border-border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
        {isLoadingSuggestions && <LoadingSpinner />}


        {currentStep !== 'done' && !isLoading && !isLoadingSuggestions && (
            <div className="flex flex-col items-center">
                 <div className="flex items-center space-x-4">
                    <button onClick={() => speakText(currentQuestion, suggestions)} className="p-4 bg-card border border-border rounded-full hover:bg-muted transition-colors" aria-label="Repeat question">
                        <SpeakerIcon className="w-8 h-8 text-foreground"/>
                    </button>
                    <button 
                        onClick={handleListen} 
                        disabled={isListening}
                        className={`p-5 rounded-full text-white transition-all duration-300 shadow-lg ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-[#ff6b1d] hover:bg-[#e55a1a]'}`}
                        aria-label="Record your answer"
                    >
                        <MicrophoneIcon className="w-10 h-10" />
                    </button>
                    <div className="w-16 h-16"></div>
                </div>
                 <p className="mt-4 text-sm text-muted-foreground">
                    {isListening ? "I'm listening..." : "Tap the mic or a suggestion to answer!"}
                </p>
            </div>
        )}

        {isLoading && currentStep === 'done' && (
            <div className="flex items-center justify-center space-x-3 text-xl font-bold text-[#ff6b1d]">
                <SparkleIcon className="w-8 h-8 animate-pulse"/>
                <span>Making your story!</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomAdventureScreen;