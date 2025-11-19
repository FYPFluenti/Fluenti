import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, FoxIcon, SparkleIcon, SpeakerIcon } from './icons';
// Fix: Changed default import to named import for LoadingSpinner.
import { LoadingSpinner } from './LoadingSpinner';
import { generateSocialAssessmentScenarios } from '@/services/geminiService';
import { SocialAssessmentResult } from '@/types/games/story-game';

interface SocialAssessmentScreenProps {
  onComplete: (results: SocialAssessmentResult[]) => void;
  isLoading: boolean;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
}

const NARRATION_PROMPTS = [
    "Okay, let's think about this situation:",
    "Great! Here is another one to think about:",
    "Perfect! Just one more scenario:",
];


const SocialAssessmentScreen: React.FC<SocialAssessmentScreenProps> = ({ onComplete, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [scenarios, setScenarios] = useState<{ scenario: string, question: string }[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<SocialAssessmentResult[]>([]);
  const [isFetchingScenarios, setIsFetchingScenarios] = useState(true);

  const silenceTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef('');

   useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const newScenarios = await generateSocialAssessmentScenarios();
        setScenarios(newScenarios);
      } catch (err) {
        setError("Could not generate scenarios. Using defaults.");
        setScenarios([
            { scenario: "Your friend Leo the Lion is sitting by himself and looks very sad.", question: "What could you say or do to help him feel better?"},
            { scenario: "You want to play with the toy Willow the Whisperer is playing with.", question: "What is a kind way to ask her?" },
            { scenario: "Sparky the Stargazer tells a joke, but you don't understand it.", question: "What could you say?" }
        ]);
      } finally {
        setIsFetchingScenarios(false);
      }
    };
    fetchScenarios();
  }, []);

  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const voiceScores: Record<string, number> = {
        'Microsoft Aria Online (Natural) - English (United States)': 100,
        'Microsoft Jenny Online (Natural) - English (United States)': 100,
        'Google US English': 90, 'Samantha': 85, 'Alex': 80,
        'Microsoft Zira Desktop - English (United States)': 75,
      };
      const scoredVoices = voices
        .filter(v => v.lang.startsWith('en'))
        .map(voice => ({ voice, score: voiceScores[voice.name] || 0 }))
        .sort((a, b) => b.score - a.score);
      setSelectedVoice(scoredVoices.length > 0 ? scoredVoices[0].voice : (voices.find(v => v.lang.startsWith('en')) || voices[0]));
    };
    if (speechSynthesis.getVoices().length > 0) setVoice();
    else if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setVoice;
    return () => {
      speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);
  
    useEffect(() => {
        return () => {
            if (recognition) recognition.stop();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, []);


  const handleEndOfRound = (newResult: SocialAssessmentResult) => {
    setResults(prevResults => {
        const updatedResults = [...prevResults, newResult];

        if (updatedResults.length < scenarios.length) {
            const nextRoundIndex = updatedResults.length;
            setCurrentRound(nextRoundIndex);
            narrateAndListen(nextRoundIndex);
        } else {
            onComplete(updatedResults);
        }

        return updatedResults;
    });
  };

  const narrateAndListen = (roundIndex: number) => {
    const currentScenario = scenarios[roundIndex];
    if (selectedVoice && currentScenario) {
        const narrationPrompt = NARRATION_PROMPTS[roundIndex] || "Let's think about this:";
        const narrationText = `${narrationPrompt} ${currentScenario.scenario}. ${currentScenario.question}`;

        const utterance = new SpeechSynthesisUtterance(narrationText);
        utterance.voice = selectedVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utterance.onend = () => startRecognition(roundIndex);
        window.speechSynthesis.speak(utterance);
    } else {
        startRecognition(roundIndex);
    }
  };


  const startRecognition = (roundIndex: number) => {
    if (!recognition || !scenarios[roundIndex]) {
        setError('Speech recognition is not supported or ready.');
        return;
    }
    
    setIsListening(true);
    transcriptRef.current = '';
    
    recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        transcriptRef.current = Array.from(event.results).map((result: any) => result[0].transcript).join('');
        silenceTimerRef.current = window.setTimeout(() => recognition?.stop(), 2500);
    };
    
    recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
    };

    recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        const finalTranscript = transcriptRef.current.trim();
        
        const newResult: SocialAssessmentResult = { 
            scenario: scenarios[roundIndex].scenario, 
            question: scenarios[roundIndex].question,
            transcript: finalTranscript,
        };
        
        handleEndOfRound(newResult);
        
        if (recognition) {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
        }
    };
    
    recognition.start();
  };

  const handleStartInteraction = () => {
    if (isLoading || hasStarted || scenarios.length === 0) return;
    setHasStarted(true);
    narrateAndListen(0);
  };
  
  const speakText = () => {
      const currentScenario = scenarios[currentRound];
      if(selectedVoice && currentScenario) {
          window.speechSynthesis.cancel();
          const narrationText = `${currentScenario.scenario} ${currentScenario.question}`;
          const utterance = new SpeechSynthesisUtterance(narrationText);
          utterance.voice = selectedVoice;
          utterance.rate = 0.95;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
      }
  }

  const currentScenario = scenarios[currentRound];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[--card-background] rounded-3xl shadow-2xl p-6 md-p-10 text-center">
        <FoxIcon className="w-20 h-20 mx-auto text-[--primary] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-[--foreground]">Friendship Check-up</h1>
        <p className="text-[--text-light] mt-2 mb-8 text-lg">Let's practice talking with friends!</p>
        
        <div className="my-8 p-6 bg-[--success-light] border-2 border-[--success] rounded-2xl min-h-[150px] flex flex-col justify-center">
          {isFetchingScenarios ? (
            <LoadingSpinner />
          ) : (
            currentScenario && <>
                <p className="text-lg text-[--success-dark] mb-2">Round {currentRound + 1} of {scenarios.length}</p>
                <p className="text-xl text-[--success-dark] mb-2">
                    {currentScenario.scenario}
                </p>
                <p className="text-2xl font-bold text-[--success-dark]">"{currentScenario.question}"</p>
            </>
          )}
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[120px]">
                <LoadingSpinner />
                <p className="mt-4 text-[--text-light]">Thinking about your answers...</p>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[120px]">
                {!hasStarted ? (
                    <button 
                        onClick={handleStartInteraction}
                        disabled={isFetchingScenarios}
                        className="p-4 rounded-2xl text-white bg-[--primary] hover:bg-[--primary-dark] shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-3 text-2xl font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="I'm Ready, start assessment"
                    >
                        <SparkleIcon className="w-8 h-8"/>
                        <span>I'm Ready!</span>
                    </button>
                ) : (
                     <div className="flex items-center space-x-4">
                        <button onClick={speakText} className="p-4 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors" aria-label="Repeat question">
                            <SpeakerIcon className="w-8 h-8 text-gray-700"/>
                        </button>
                        <div 
                            className={`p-5 rounded-full text-white transition-all duration-300 shadow-lg transform ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-[--success]'}`}
                            aria-label="Microphone active"
                        >
                            <MicrophoneIcon className="w-10 h-10" />
                        </div>
                        <div className="w-16 h-16"></div>
                    </div>
                )}
                 <p className="mt-4 text-sm text-[--text-light] h-5">
                    {isListening ? "I'm listening for your idea..." : (hasStarted ? "Tell me what you would do!" : "Let's get started!")}
                </p>
            </div>
        )}

        {error && <p className="mt-4 text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
      </div>
    </div>
  );
};

export default SocialAssessmentScreen;