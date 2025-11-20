import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, StoryChunk, GameAction, Theme, SpeechFeedback, ThematicFeedback, PronunciationBadge, MAX_SCORE, CHALLENGES_PER_LEVEL, MAX_FOCUS_STARS, TherapyType } from '@/types/games/story-game';
import { LoadingSpinner } from './LoadingSpinner';
import { FoxIcon, MicrophoneIcon, SpeakerIcon, FantasyForestIcon, JungleAdventureIcon, SpaceQuestIcon, MagicalSchoolIcon, SparkleIcon, TrophyIcon, StarIcon } from './icons';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StoryScreenProps {
  gameState: GameState;
  onContinue: (userInput: string) => void;
  dispatch: React.Dispatch<GameAction>;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
}

function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const StoryScreen: React.FC<StoryScreenProps> = ({ gameState, onContinue, dispatch }) => {
  const { story, isLoading, isListening, error, totalScore, speechScore, levels, focusStars, theme, isOnCooldown, endingType, therapyType, wordBank } = gameState;
  const storyEndRef = useRef<HTMLDivElement>(null);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [areSuggestionsVisible, setAreSuggestionsVisible] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  
  const [totalScoreAnimation, setTotalScoreAnimation] = useState('');
  const [speechScoreAnimation, setSpeechScoreAnimation] = useState('');
  const [starAnimation, setStarAnimation] = useState('');
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeaking = useRef(false);

  const silenceTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef('');

  const prevTotalScore = usePrevious(totalScore);
  const prevSpeechScore = usePrevious(speechScore);
  const prevFocusStars = usePrevious(focusStars);

  const therapyName = {
    pronunciation: 'Pronunciation',
    fluency: 'Fluency',
    dld: 'Language',
    social: 'Social',
    none: 'Speech',
  }[therapyType];
  
  const currentLevel = therapyType !== 'none' ? levels[therapyType] : 1;
  const lastChunk = story[story.length - 1];

  // Animate Total Score
  useEffect(() => {
    if (prevTotalScore !== totalScore) {
      setTotalScoreAnimation('animate-pop');
      const timer = setTimeout(() => setTotalScoreAnimation(''), 500);
      return () => clearTimeout(timer);
    }
  }, [totalScore, prevTotalScore]);

  // Animate Speech Score
  useEffect(() => {
    if (prevSpeechScore !== speechScore) {
      setSpeechScoreAnimation(speechScore > prevSpeechScore ? 'animate-pop' : 'animate-shake');
      const timer = setTimeout(() => setSpeechScoreAnimation(''), 500);
      return () => clearTimeout(timer);
    }
  }, [speechScore, prevSpeechScore]);

  // Animate Stars
  useEffect(() => {
    if (prevFocusStars !== focusStars) {
      setStarAnimation(focusStars > prevFocusStars ? 'animate-pop' : 'animate-shake');
      const timer = setTimeout(() => setStarAnimation(''), 500);
      return () => clearTimeout(timer);
    }
  }, [focusStars, prevFocusStars]);

  useEffect(() => {
    return () => {
        if (recognition) {
            recognition.stop();
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        window.speechSynthesis.cancel();
    };
  }, []);

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
        .map(voice => {
          let score = voiceScores[voice.name] || 0;
          if (voice.name.toLowerCase().includes('natural')) score += 50;
          if (voice.name.toLowerCase().includes('female')) score += 5;
          if (voice.localService) score += 5;
          if (voice.default) score += 1;
          return { voice, score };
        })
        .sort((a, b) => b.score - a.score);

      if (scoredVoices.length > 0) {
        setSelectedVoice(scoredVoices[0].voice);
      } else {
        setSelectedVoice(voices.find(v => v.lang.startsWith('en')) || voices[0]);
      }
    };

    setVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = setVoice;
    }

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getChallengePrompt = useCallback(() => {
    if (!lastChunk?.challenge) return null;
    const { prompt } = lastChunk.challenge;
    // The prompt from the AI is now the single source of truth for the challenge text.
    return prompt;
  }, [lastChunk]);

  const processSpeechQueue = useCallback(() => {
    if (isSpeaking.current || utteranceQueue.current.length === 0) {
      if (utteranceQueue.current.length === 0) {
          setIsNarrating(false); // No more items, narration is done
      }
      return;
    }
    isSpeaking.current = true;
    const utterance = utteranceQueue.current.shift();
    if (utterance) {
      const originalOnEnd = utterance.onend;
      utterance.onend = function (event) {
        if (originalOnEnd && typeof originalOnEnd === 'function') {
          originalOnEnd.call(this, event);
        }
        isSpeaking.current = false;
        processSpeechQueue();
      };
      window.speechSynthesis.speak(utterance);
    } else {
        isSpeaking.current = false;
        setIsNarrating(false);
    }
  }, []);

  const speakFromQueue = useCallback((texts: {text: string, onEnd?: () => void}[]) => {
      window.speechSynthesis.cancel();
      isSpeaking.current = false;
      utteranceQueue.current = [];
      setIsNarrating(false);

      if (!selectedVoice || texts.length === 0) return;

      setIsNarrating(true);
      texts.forEach(({text, onEnd}, index) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = selectedVoice;
          utterance.rate = 1;
          utterance.pitch = 1;
          if (index === texts.length - 1 && onEnd) {
             const originalOnEnd = utterance.onend;
             utterance.onend = function (event) {
                if (originalOnEnd && typeof originalOnEnd === 'function') {
                    originalOnEnd.call(this, event);
                }
                onEnd();
             };
          }
          utteranceQueue.current.push(utterance);
      });
      processSpeechQueue();
  }, [selectedVoice, processSpeechQueue]);
  
  useEffect(() => {
    if (lastChunk && lastChunk.author === 'ai' && lastChunk.text && lastChunk.text !== lastSpokenText && selectedVoice) {
        setAreSuggestionsVisible(false);
        setLastSpokenText(lastChunk.text);

        const textsToSpeak: {text: string, onEnd?: () => void}[] = [];
        
        // Always speak the main story text that leads into the action
        if (lastChunk.text) {
          textsToSpeak.push({ text: lastChunk.text.replace(/\*\*/g, '') });
        }
        
        const finalOnEnd = () => {
            if (endingType) {
                 dispatch({ type: 'FINISH_STORY_NARRATION' });
            } else {
                setAreSuggestionsVisible(true);
            }
        };

        // If it's a challenge, speak the challenge prompt.
        if (lastChunk.challenge) {
            const challengePromptText = getChallengePrompt();
            if (challengePromptText) {
                textsToSpeak.push({ text: challengePromptText, onEnd: finalOnEnd });
            } else {
                // Fallback if prompt is missing but challenge object exists
                if (textsToSpeak.length > 0) textsToSpeak[textsToSpeak.length-1].onEnd = finalOnEnd;
            }
        } 
        // If it's NOT a challenge and there are suggestions, speak the suggestions.
        else if (!endingType && lastChunk.suggestions && lastChunk.suggestions.length > 0) {
            const characterName = gameState.character?.name?.split(' ')[0] || 'the hero';
            textsToSpeak.push({
                text: `Should ${characterName}: ${lastChunk.suggestions.join(', or ')}?`,
                onEnd: finalOnEnd
            });
        } 
        // Otherwise (no challenge, no suggestions), just set the onEnd for the main story text.
        else {
            if (textsToSpeak.length > 0) {
               textsToSpeak[textsToSpeak.length - 1].onEnd = finalOnEnd;
            } else {
                finalOnEnd();
            }
        }

        speakFromQueue(textsToSpeak);
    }
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
  }, [story, selectedVoice, endingType, dispatch, lastSpokenText, speakFromQueue, therapyType, wordBank, gameState.character, getChallengePrompt, lastChunk]);

  const handleListen = () => {
    if (!recognition) {
        dispatch({ type: 'CONTINUE_STORY_FAILURE', payload: 'Speech recognition is not supported in your browser.' });
        return;
    }
    if (isListening || isLoading || isOnCooldown || isNarrating) return;

    transcriptRef.current = '';
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = fullTranscript;
        silenceTimerRef.current = window.setTimeout(() => recognition?.stop(), 2500);
    };

    recognition.onerror = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      dispatch({ type: 'CONTINUE_STORY_FAILURE', payload: `Speech recognition error: ${event.error}` });
    };
    
    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      dispatch({ type: 'STOP_LISTENING' });

      const finalInput = transcriptRef.current.trim();
      
      if (finalInput) {
        onContinue(finalInput);
      }
      
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
    
    dispatch({ type: 'START_LISTENING' });
    recognition.start();
  };

  const getThemeIcon = (currentTheme: Theme | null) => {
    switch(currentTheme) {
        case 'Fantasy Forest': return <FantasyForestIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
        case 'Jungle Adventure': return <JungleAdventureIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
        case 'Space Quest': return <SpaceQuestIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
        case 'Magical School': return <MagicalSchoolIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
        default: return <FoxIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
    }
  }

  const renderChunk = (chunk: StoryChunk) => {
    const isAI = chunk.author === 'ai';
    // Safety check: ensure text exists before rendering
    if (!chunk.text) {
      return null; // Skip rendering if text is missing
    }
    return (
      <div key={chunk.id} className={`flex items-start gap-4 ${isAI ? '' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isAI ? 'bg-gradient-to-br from-[#ff6b1d] to-orange-600' : 'bg-gradient-to-br from-[#F5B82E] to-yellow-500'}`}>
          {isAI ? getThemeIcon(theme) : <span className="text-xl md:text-2xl font-bold text-white">Y</span>}
        </div>
        
        {/* Message Bubble */}
        <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${isAI ? '' : 'flex justify-end'}`}>
          <div className={`rounded-2xl shadow-md ${isAI ? 'bg-white border-2 border-orange-100 rounded-tl-sm' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-tr-sm'}`}>
            <div className={`p-4 md:p-5 ${isAI ? 'text-gray-800' : 'text-gray-900'}`}>
              <p className="text-base md:text-lg leading-relaxed font-normal whitespace-pre-wrap">
                {chunk.text.replace(/\*\*/g, '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const isDldChallenge = therapyType === 'dld' && lastChunk?.author === 'ai' && lastChunk?.challenge?.type === 'dld';

  const getFooterText = () => {
      if (isListening) return "Listening...";
      if (isNarrating) return "Listen to the story...";
      if (isOnCooldown) return "Let's take a moment...";
      if (lastChunk?.challenge) {
          return lastChunk.challenge.type === 'dld' ? "Answer the question!" : "Speak the magic phrase!";
      }
      return "Tap the mic to tell me what happens next!";
  }

  const handleQuitClick = () => {
    setShowQuitDialog(true);
  };

  const handleQuitConfirm = () => {
    // Clear saved story state from localStorage
    try {
      const STORY_GAME_STORAGE_KEY = 'storyGameState';
      const savedState = localStorage.getItem(STORY_GAME_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only clear if we're in the playing phase
        if (parsed.phase === 'playing') {
          // Clear story-related state but keep levels and therapy type
          parsed.phase = 'characterSelection';
          parsed.story = [];
          parsed.character = null;
          parsed.theme = null;
          parsed.totalScore = 0;
          parsed.speechScore = 0;
          parsed.speechChallengesCompletedInLevel = 0;
          parsed.focusStars = 3;
          parsed.endingType = null;
          parsed.rewardContent = null;
          localStorage.setItem(STORY_GAME_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to update saved state on quit:', error);
    }
    setShowQuitDialog(false);
    dispatch({ type: 'QUIT_GAME' });
  };

  return (
    <>
      <div className="h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-orange-50 flex flex-col w-full overflow-hidden">
        {/* Top Header Bar - Theme & Quit */}
        <header className="bg-white/95 backdrop-blur-sm border-b-2 border-orange-200/50 shadow-md sticky top-0 z-20 w-full">
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#ff6b1d] to-orange-600 flex items-center justify-center shadow-md">
                {getThemeIcon(theme)}
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-[#ff6b1d] tracking-tight">{gameState.theme}</h1>
            </div>
            <button
              onClick={handleQuitClick}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-red-50 transition-all duration-200 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-300 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow mr-8 md:mr-16"
              aria-label="Quit game"
              title="Quit game"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Quit</span>
            </button>
          </div>
          
          {/* Stats Bar - Compact and Organized */}
          <div className="bg-gradient-to-r from-orange-50/50 to-yellow-50/50 border-t border-orange-100/50 px-4 py-2.5 md:px-6 md:py-3">
            <div className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 flex-wrap">
              {/* Level Card */}
              <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-blue-100">
                <div className="text-blue-600">
                  <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">{therapyName} Level</div>
                  <div className={`text-lg md:text-2xl font-bold leading-tight ${speechScoreAnimation}`}>{currentLevel}</div>
                </div>
              </div>
              
              {/* Score Card */}
              <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-green-100">
                <div className="text-green-600">
                  <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">{therapyName}</div>
                  <div className={`text-lg md:text-2xl font-bold leading-tight ${speechScoreAnimation}`}>{speechScore}</div>
                </div>
              </div>
              
              {/* Creativity Card */}
              <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-yellow-100">
                <div className="text-yellow-600">
                  <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">Creativity</div>
                  <div className={`text-lg md:text-2xl font-bold leading-tight ${totalScoreAnimation}`}>{totalScore}</div>
                </div>
              </div>
              
              {/* Stars Card */}
              <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-purple-100">
                <div className="text-center">
                  <div className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Focus</div>
                  <div className={`flex items-center gap-0.5 ${starAnimation}`}>
                    {[...Array(MAX_FOCUS_STARS)].map((_, i) => (
                      <StarIcon key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < focusStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Progress Card */}
              <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-orange-100">
                <div className="text-orange-600">
                  <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">Progress</div>
                  <div className="text-lg md:text-2xl font-bold leading-tight">{gameState.speechChallengesCompletedInLevel}/{CHALLENGES_PER_LEVEL}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Main Story Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8" style={{ minHeight: 0 }}>
        <div className="max-w-3xl mx-auto">
          {isLoading && story.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <LoadingSpinner />
              <p className="mt-6 text-base md:text-lg text-gray-600 font-medium">Our storyteller is starting your adventure...</p>
            </div>
          ) : story.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-xl md:text-2xl text-gray-600 font-semibold">The story is about to begin...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {story.map(renderChunk)}
              <div ref={storyEndRef} />
            </div>
          )}
        </div>
      </main>
      
      {/* Error Display */}
      {error && (
        <div className="mx-4 md:mx-6 mb-4">
          <div className="max-w-3xl mx-auto bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 text-center font-medium shadow-sm">
            {error}
          </div>
        </div>
      )}

      {/* Footer - Controls and Interactions */}
      <footer className="sticky bottom-0 z-10 flex-shrink-0">
        {endingType ? (
          <div className="text-center py-8 px-4 pointer-events-none">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-3xl md:text-4xl font-bold text-[#ff6b1d]">The End</p>
            <p className="text-gray-600 mt-2 text-lg">Great adventure!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-5">
            {/* Challenge Prompt */}
            {lastChunk?.challenge && (
              <div className="mb-4 md:mb-5">
                <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-200 rounded-2xl p-4 md:p-5 text-center shadow-md">
                  <p className="text-lg md:text-xl font-bold text-[#ff6b1d] animate-pulse">
                    {getChallengePrompt()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Suggestions - Display Only (Not Clickable) */}
            {areSuggestionsVisible && lastChunk?.suggestions && lastChunk.suggestions.length > 0 && !isLoading && !isListening && !lastChunk.challenge && (
              <div className="mb-4 md:mb-5">
                <p className="text-xs md:text-sm font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">Choose what happens next:</p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  {lastChunk.suggestions?.map((suggestion, index) => (
                    <div
                      key={index}
                      className="font-semibold py-2.5 px-5 md:px-6 rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-sm md:text-base pointer-events-none"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Word Bank */}
            {isDldChallenge && wordBank.length > 0 && (
              <div className="mb-4 md:mb-5">
                <p className="text-xs md:text-sm font-bold text-gray-700 mb-2.5 text-center">✨ Your New Words! ✨</p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
                  {wordBank.map((word, index) => (
                    <div key={index} className="font-semibold py-1.5 px-4 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-2 border-yellow-200 shadow-sm text-sm md:text-base">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main Controls */}
            <div className="flex flex-col items-center">
              {isLoading ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                  <p className="mt-3 text-gray-600 font-medium">Our storyteller is thinking...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4 md:gap-6 mb-3">
                    {/* Repeat Button */}
                    <button 
                      onClick={() => speakFromQueue([{text: (lastSpokenText || '').replace(/\*\*/g, '')}])} 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
                      aria-label="Repeat last sentence" 
                      disabled={isNarrating}
                    >
                      <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700"/>
                    </button>
                    
                    {/* Main Microphone Button */}
                    <button 
                      onClick={handleListen} 
                      disabled={isOnCooldown || isNarrating || isListening}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-white transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center ${
                        isListening 
                          ? 'bg-red-500 animate-pulse scale-110 ring-4 ring-red-200' 
                          : (isOnCooldown || isNarrating) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-br from-[#ff6b1d] to-orange-600 hover:from-[#e55a1a] hover:to-orange-700'
                      }`}
                      aria-label="Record your voice"
                    >
                      <MicrophoneIcon className="w-8 h-8 md:w-10 md:h-10" />
                    </button>
                    
                    {/* Spacer for symmetry */}
                    <div className="w-12 h-12 md:w-14 md:h-14"></div>
                  </div>
                  
                  {/* Status Text */}
                  <p className="text-sm md:text-base text-gray-600 font-medium min-h-[24px] text-center">
                    {getFooterText()}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </footer>
    </div>

    <AlertDialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
      <AlertDialogContent className="bg-white border-orange-200 rounded-xl shadow-lg max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-800 text-center">
            Quit Game?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-center text-base pt-2">
            Are you sure you want to quit? Your progress will be saved, but you'll need to start a new story.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 justify-center sm:justify-center pt-4">
          <AlertDialogCancel 
            onClick={() => setShowQuitDialog(false)}
            className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleQuitConfirm}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#ff6b1d] to-orange-500 text-white border-[#ff6b1d] hover:from-[#e55a1a] hover:to-orange-600 font-medium shadow-md"
          >
            Quit Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default StoryScreen;