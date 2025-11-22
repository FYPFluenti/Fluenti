import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, StoryChunk, GameAction, Theme, SpeechFeedback, ThematicFeedback, PronunciationBadge, MAX_SCORE, CHALLENGES_PER_LEVEL, MAX_FOCUS_STARS, TherapyType } from '@/types/games/story-game';
import { LoadingSpinner } from './LoadingSpinner';
import { FoxIcon, MicrophoneIcon, SpeakerIcon, FantasyForestIcon, JungleAdventureIcon, SpaceQuestIcon, MagicalSchoolIcon, SparkleIcon, TrophyIcon, StarIcon, FootstepsIcon, EyeIcon, MagnifyingGlassIcon, SmellTrailIcon } from './icons';
import { X, Trophy, Star, Palette, Bell } from 'lucide-react';
import ThemeBackground from './ThemeBackground';
import StoryBookCard from './StoryBookCard';
import CharacterPortrait from './CharacterPortrait';
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
  const renderedChunksRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const getSuggestionIcon = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    // Match keywords to icons
    if (lowerSuggestion.includes('tiptoe') || lowerSuggestion.includes('step') || lowerSuggestion.includes('walk') || lowerSuggestion.includes('sneak')) {
      return <FootstepsIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />;
    }
    if (lowerSuggestion.includes('peep') || lowerSuggestion.includes('look') || lowerSuggestion.includes('watch') || lowerSuggestion.includes('see')) {
      return <EyeIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />;
    }
    if (lowerSuggestion.includes('inspect') || lowerSuggestion.includes('examine') || lowerSuggestion.includes('search') || lowerSuggestion.includes('investigate')) {
      return <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />;
    }
    if (lowerSuggestion.includes('sniff') || lowerSuggestion.includes('smell') || lowerSuggestion.includes('scent')) {
      return <SmellTrailIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />;
    }
    
    // Default icon for other suggestions
    return <SparkleIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />;
  };

  const playHoverSound = useCallback(() => {
    try {
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (required after user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          // Silently fail if resume is not possible
        });
      }
      
      // Create a simple, pleasant tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Higher, more pleasant frequency
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      // Quick, subtle sound
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Hover sound not available:', error);
    }
  }, []);

  const renderChunk = (chunk: StoryChunk, index: number) => {
    const isAI = chunk.author === 'ai';
    // Safety check: ensure text exists before rendering
    if (!chunk.text) {
      return null; // Skip rendering if text is missing
    }

    // Check if this is a new chunk
    const chunkId = String(chunk.id);
    const isNewChunk = !renderedChunksRef.current.has(chunkId);
    if (isNewChunk) {
      renderedChunksRef.current.add(chunkId);
    }

    const isLastChunk = index === story.length - 1;

    return (
      <div key={chunk.id} className={`flex items-start gap-4 ${isAI ? '' : 'flex-row-reverse'}`}>
        {/* Character Portrait (AI) or User Avatar */}
        {isAI ? (
          <CharacterPortrait
            character={gameState.character}
            theme={theme}
            isListening={isListening && isLastChunk}
            isNarrating={isNarrating && isLastChunk}
            className="flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-20 relative bg-gradient-to-br from-[#F5B82E] to-yellow-500">
            <span className="text-xl md:text-2xl font-bold text-white">Y</span>
          </div>
        )}
        
        {/* Message Container */}
        <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${isAI ? '' : 'flex justify-end'} relative z-10`}>
          {isAI ? (
            // Storybook Card for AI messages
            <StoryBookCard 
              text={chunk.text.replace(/\*\*/g, '')}
              isNew={isNewChunk}
              delay={index * 50}
            />
          ) : (
            // Regular message bubble for user messages
            <div className="rounded-2xl shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-tr-sm">
              <div className="p-4 md:p-5 text-gray-900">
                <p className="text-base md:text-lg leading-relaxed font-normal whitespace-pre-wrap">
                  {chunk.text.replace(/\*\*/g, '')}
                </p>
              </div>
            </div>
          )}
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
      <div className="h-screen flex flex-col w-full overflow-hidden relative">
        {/* Immersive Theme Background Layer */}
        <ThemeBackground theme={theme} />
        {/* Compact Gamified Top Ribbon - Reduced Height by 60-70% */}
        <header className="bg-gradient-to-r from-white via-orange-50/30 to-white backdrop-blur-sm border-b border-orange-200/60 shadow-sm sticky top-0 z-30 w-full">
          {/* Single Ultra-Compact Row: Theme, Stats, Quit */}
          <div className="flex items-center justify-between px-2 py-1 md:px-3 md:py-1.5 gap-1.5">
            {/* Left: Theme Name */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#ff6b1d] to-orange-600 flex items-center justify-center shadow-sm">
                {getThemeIcon(theme)}
              </div>
              <h1 className="text-sm md:text-base font-bold text-[#ff6b1d] tracking-tight hidden sm:block truncate max-w-[120px] md:max-w-none">{gameState.theme}</h1>
            </div>
            
            {/* Center: Ultra-Compact Stats Ribbon */}
            <div className="flex items-center gap-1 md:gap-1.5 flex-1 justify-center min-w-0 overflow-x-auto scrollbar-hide px-1">
              {/* 🏆 Level */}
              <div className="flex items-center gap-1 bg-gradient-to-br from-blue-50 to-blue-100/90 rounded-md px-1.5 py-0.5 md:px-2 md:py-1 border border-blue-200/70 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 flex-shrink-0" />
                <span className={`text-sm md:text-base font-bold text-blue-600 leading-none ${speechScoreAnimation}`}>{currentLevel}</span>
              </div>
              
              {/* ⭐ Pronunciation */}
              <div className="flex items-center gap-1 bg-gradient-to-br from-green-50 to-green-100/90 rounded-md px-1.5 py-0.5 md:px-2 md:py-1 border border-green-200/70 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-600 fill-green-500 flex-shrink-0" />
                <span className={`text-sm md:text-base font-bold text-green-600 leading-none ${speechScoreAnimation}`}>{speechScore}</span>
              </div>
              
              {/* 🎨 Creativity */}
              <div className="flex items-center gap-1 bg-gradient-to-br from-yellow-50 to-yellow-100/90 rounded-md px-1.5 py-0.5 md:px-2 md:py-1 border border-yellow-200/70 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                <Palette className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-600 flex-shrink-0" />
                <span className={`text-sm md:text-base font-bold text-yellow-600 leading-none ${totalScoreAnimation}`}>{totalScore}</span>
              </div>
              
              {/* 🔔 Focus Stars */}
              <div className="flex items-center gap-1 bg-gradient-to-br from-purple-50 to-purple-100/90 rounded-md px-1.5 py-0.5 md:px-2 md:py-1 border border-purple-200/70 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                <Bell className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600 flex-shrink-0" />
                <div className={`flex items-center gap-0.5 ${starAnimation}`}>
                  {[...Array(MAX_FOCUS_STARS)].map((_, i) => (
                    <StarIcon key={i} className={`w-2.5 h-2.5 md:w-3 md:h-3 ${i < focusStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              
              {/* Progress Bar - Compact */}
              <div className="hidden md:flex items-center gap-1 bg-gradient-to-br from-orange-50 to-orange-100/90 rounded-md px-1.5 py-0.5 md:px-2 md:py-1 border border-orange-200/70 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                <div className="w-10 h-1.5 bg-orange-200/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300"
                    style={{ width: `${(gameState.speechChallengesCompletedInLevel / CHALLENGES_PER_LEVEL) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-orange-700 leading-none">{gameState.speechChallengesCompletedInLevel}/{CHALLENGES_PER_LEVEL}</span>
              </div>
              
              {/* Quit Button - Positioned after Progress Bar */}
              <button
                onClick={handleQuitClick}
                className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 text-gray-700 hover:text-red-600 border border-gray-300 hover:border-red-400 flex items-center gap-1.5 text-xs md:text-sm font-medium shadow-sm hover:shadow-md bg-white/80 flex-shrink-0 ml-1"
                aria-label="Quit game"
                title="Quit game"
              >
                <span>Quit</span>
              </button>
            </div>
          </div>
        </header>

      {/* Main Story Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 relative z-10" style={{ minHeight: 0 }}>
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
              {story.map((chunk, index) => renderChunk(chunk, index))}
              <div ref={storyEndRef} />
            </div>
          )}
        </div>
      </main>
      
      {/* Error Display */}
      {error && (
        <div className="mx-4 md:mx-6 mb-4 relative z-10">
          <div className="max-w-3xl mx-auto bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 text-center font-medium shadow-sm">
            {error}
          </div>
        </div>
      )}

      {/* Footer - Controls and Interactions */}
      <footer className="sticky bottom-0 z-20 flex-shrink-0 bg-transparent">
        {endingType ? (
          <div className="text-center py-6 px-4 pointer-events-none">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-2xl md:text-3xl font-bold text-[#ff6b1d]">The End</p>
            <p className="text-gray-600 mt-2 text-base">Great adventure!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-2 md:py-3 relative">
            {/* Challenge Prompt */}
            {lastChunk?.challenge && (
              <div className="mb-2 md:mb-3">
                <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-200 rounded-xl p-2 md:p-3 text-center shadow-md">
                  <p className="text-base md:text-lg font-bold text-[#ff6b1d] animate-pulse">
                    {getChallengePrompt()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Suggestions - Illustrated Choice Cards */}
            {areSuggestionsVisible && lastChunk?.suggestions && lastChunk.suggestions.length > 0 && !isLoading && !isListening && !lastChunk.challenge && (
              <div className="mb-2 md:mb-3">
                <p className="text-[10px] md:text-xs font-semibold text-gray-600 mb-1.5 text-center uppercase tracking-wide">Choose what happens next:</p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
                  {lastChunk.suggestions?.map((suggestion, index) => (
                    <div
                      key={index}
                      className="group font-semibold py-1.5 px-3 md:px-3.5 rounded-lg border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-xs md:text-sm pointer-events-none cursor-default transition-all duration-200 hover:shadow-lg hover:scale-105 animate-bounce-on-hover relative overflow-hidden"
                      onMouseEnter={playHoverSound}
                    >
                      {/* Sparkle trail effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-sparkle" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute top-1 right-3 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle" style={{ animationDelay: '0.2s' }}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      
                      {/* Icon and Text */}
                      <div className="flex items-center gap-1.5 md:gap-2 relative z-10">
                        <div className="text-yellow-600 group-hover:text-yellow-700 transition-colors">
                          {getSuggestionIcon(suggestion)}
                        </div>
                        <span className="relative">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Word Bank */}
            {isDldChallenge && wordBank.length > 0 && (
              <div className="mb-2 md:mb-3">
                <p className="text-[10px] md:text-xs font-bold text-gray-700 mb-1.5 text-center">✨ Your New Words! ✨</p>
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                  {wordBank.map((word, index) => (
                    <div key={index} className="font-semibold py-1 px-2.5 md:px-3 rounded-md bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-2 border-yellow-200 shadow-sm text-xs md:text-sm">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main Controls */}
            <div className="flex flex-col items-center">
              {isLoading ? (
                <div className="text-center py-2">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-600 font-medium">Our storyteller is thinking...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3 md:gap-4 mb-2">
                    {/* Repeat Button */}
                    <button 
                      onClick={() => speakFromQueue([{text: (lastSpokenText || '').replace(/\*\*/g, '')}])} 
                      className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
                      aria-label="Repeat last sentence" 
                      disabled={isNarrating}
                    >
                      <SpeakerIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-700"/>
                    </button>
                    
                    {/* Magical Voice Circle */}
                    <button 
                      onClick={handleListen} 
                      disabled={isOnCooldown || isNarrating || isListening}
                      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                        isOnCooldown || isNarrating 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer hover:scale-105'
                      }`}
                      aria-label="Cast magic with your voice"
                    >
                      {/* Pulsing Rings - Only when listening */}
                      {isListening && (
                        <>
                          <div className="absolute inset-0 rounded-full border-3 border-orange-400/60 animate-pulse-ring-1"></div>
                          <div className="absolute inset-0 rounded-full border-3 border-orange-300/50 animate-pulse-ring-2"></div>
                          <div className="absolute inset-0 rounded-full border-3 border-orange-200/40 animate-pulse-ring-3"></div>
                        </>
                      )}
                      
                      {/* Glowing Magical Circle */}
                      <div className={`absolute inset-0 rounded-full ${
                        isListening
                          ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-[#ff6b1d] shadow-[0_0_20px_rgba(249,115,22,0.8),0_0_40px_rgba(249,115,22,0.6),0_0_60px_rgba(255,107,29,0.4)] animate-pulse'
                          : (isOnCooldown || isNarrating)
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                            : 'bg-gradient-to-br from-orange-400 via-orange-500 to-[#ff6b1d] shadow-[0_0_15px_rgba(249,115,22,0.6),0_0_30px_rgba(255,107,29,0.4)] hover:shadow-[0_0_20px_rgba(249,115,22,0.8),0_0_40px_rgba(255,107,29,0.6)]'
                      } transition-all duration-300`}></div>
                      
                      {/* Inner Glow Circle */}
                      <div className={`absolute inset-1.5 md:inset-2 rounded-full ${
                        isListening
                          ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500'
                          : (isOnCooldown || isNarrating)
                            ? 'bg-gray-300'
                            : 'bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400'
                      } transition-all duration-300`}></div>
                      
                      {/* Magical Symbol/Icon */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isListening ? (
                          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 flex items-center justify-center animate-pulse">
                            <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-orange-500"></div>
                          </div>
                        ) : (
                          <SparkleIcon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                        )}
                      </div>
                      
                      {/* Floating Particles - Stars and Sparkles */}
                      {!isOnCooldown && !isNarrating && (
                        <>
                          <div className="absolute top-1 left-3 w-1.5 h-1.5 text-yellow-300 animate-float-particle-1">
                            <StarIcon className="w-full h-full fill-current" />
                          </div>
                          <div className="absolute top-4 right-1.5 w-1 h-1 text-pink-300 animate-float-particle-2">
                            <SparkleIcon className="w-full h-full" />
                          </div>
                          <div className="absolute bottom-3 left-1.5 w-1 h-1 text-purple-300 animate-float-particle-3">
                            <SparkleIcon className="w-full h-full" />
                          </div>
                          <div className="absolute bottom-1 right-4 w-1.5 h-1.5 text-orange-300 animate-float-particle-4">
                            <StarIcon className="w-full h-full fill-current" />
                          </div>
                          {isListening && (
                            <>
                              <div className="absolute top-1/2 left-0 w-1.5 h-1.5 text-orange-300 animate-float-particle-5">
                                <SparkleIcon className="w-full h-full" />
                              </div>
                              <div className="absolute top-1/2 right-0 w-1.5 h-1.5 text-orange-400 animate-float-particle-6">
                                <StarIcon className="w-full h-full fill-current" />
                              </div>
                              <div className="absolute top-0 left-1/2 w-1 h-1 text-yellow-300 animate-float-particle-7">
                                <SparkleIcon className="w-full h-full" />
                              </div>
                              <div className="absolute bottom-0 left-1/2 w-1 h-1 text-orange-300 animate-float-particle-8">
                                <StarIcon className="w-full h-full fill-current" />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </button>
                    
                    {/* Spacer for symmetry */}
                    <div className="w-10 h-10 md:w-11 md:h-11"></div>
                  </div>
                  
                  {/* Status Text */}
                  <p className="text-xs md:text-sm text-gray-600 font-medium min-h-[20px] text-center">
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