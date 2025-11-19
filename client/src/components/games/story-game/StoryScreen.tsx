import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, StoryChunk, GameAction, Theme, SpeechFeedback, ThematicFeedback, PronunciationBadge, MAX_SCORE, CHALLENGES_PER_LEVEL, MAX_FOCUS_STARS, TherapyType } from '@/types/games/story-game';
import { LoadingSpinner } from './LoadingSpinner';
import { FoxIcon, MicrophoneIcon, SpeakerIcon, FantasyForestIcon, JungleAdventureIcon, SpaceQuestIcon, MagicalSchoolIcon, SparkleIcon, TrophyIcon, StarIcon } from './icons';

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
        case 'Fantasy Forest': return <FantasyForestIcon className="w-8 h-8 text-white" />;
        case 'Jungle Adventure': return <JungleAdventureIcon className="w-8 h-8 text-white" />;
        case 'Space Quest': return <SpaceQuestIcon className="w-8 h-8 text-white" />;
        case 'Magical School': return <MagicalSchoolIcon className="w-8 h-8 text-white" />;
        default: return <FoxIcon className="w-8 h-8 text-white" />;
    }
  }

  const renderChunk = (chunk: StoryChunk) => {
    const isAI = chunk.author === 'ai';
    // Safety check: ensure text exists before rendering
    if (!chunk.text) {
      return null; // Skip rendering if text is missing
    }
    return (
      <div key={chunk.id} className={`flex items-start gap-4 my-4 ${isAI ? '' : 'flex-row-reverse'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-[--primary]' : 'bg-[--secondary]'}`}>
          {isAI ? getThemeIcon(theme) : <span className="text-2xl font-bold text-white">Y</span>}
        </div>
        <div className={`p-4 rounded-2xl max-w-xs md:max-w-md lg:max-w-lg ${isAI ? 'bg-[--primary-bg-light] text-[--primary-dark]' : 'bg-gray-100 text-gray-800'}`}>
          <p>{chunk.text.replace(/\*\*/g, '')}</p>
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

  return (
    <div className="min-h-screen bg-[--background] flex flex-col w-full overflow-x-hidden">
      <header className="bg-[--card-background] shadow-md p-3 md:p-4 sticky top-0 z-10 w-full relative">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 max-w-full px-2 relative">
          <h1 className="text-lg md:text-xl font-bold text-[--primary] whitespace-nowrap order-1 md:order-none md:absolute md:left-4">{gameState.theme}</h1>
          <div className="flex items-center justify-center flex-wrap gap-3 md:gap-4 text-center order-2 md:order-none md:flex-1 md:justify-center">
            <div className="text-sm md:text-lg font-bold text-blue-600">
                <div className="text-xs md:text-sm">{therapyName} Lvl.</div>
                <div className="text-base md:text-xl">{currentLevel}</div>
            </div>
            <div className="text-sm md:text-lg font-bold text-green-600">
                <div className="text-xs md:text-sm">{therapyName}</div>
                <div className={`text-base md:text-xl ${speechScoreAnimation}`}>{speechScore}</div>
            </div>
            <div className="text-sm md:text-lg font-bold text-[--secondary]">
                <div className="text-xs md:text-sm">Creativity</div>
                <div className={`text-base md:text-xl ${totalScoreAnimation}`}>{totalScore}</div>
            </div>
            <div className="text-sm md:text-lg font-bold text-gray-500">
                <div className="text-xs md:text-sm">Focus Stars</div>
                <div className={`flex justify-center mt-1 ${starAnimation}`}>
                    {[...Array(MAX_FOCUS_STARS)].map((_, i) => (
                        <StarIcon key={i} className={`w-4 h-4 md:w-6 md:h-6 ${i < focusStars ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                </div>
            </div>
            <div className="text-sm md:text-lg font-bold text-[--primary]">
                <div className="text-xs md:text-sm">Next Level</div>
                <div className="text-base md:text-xl">{gameState.speechChallengesCompletedInLevel} / {CHALLENGES_PER_LEVEL}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {isLoading && story.length === 0 ? (
              <div className="text-center p-8">
                <LoadingSpinner />
                <p className="mt-4 text-[--text-light]">Our storyteller is starting your adventure...</p>
              </div>
            ) : story.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-lg text-[--text-light]">The story is about to begin...</p>
              </div>
            ) : (
              <>
                {story.map(renderChunk)}
                <div ref={storyEndRef} />
              </>
            )}
          </div>
      </main>
      
      {error && <div className="text-center p-2 bg-red-100 text-red-700">{error}</div>}

      <footer className="bg-[--card-background] pt-2 pb-4 sticky bottom-0 border-t">
        {endingType ? (
            <div className="text-center p-4 pointer-events-none">
                <p className="text-2xl font-bold text-[--primary]">The End</p>
            </div>
        ) : (
            <>
                {lastChunk?.challenge && (
                    <div className="text-center p-4 font-bold text-[--primary] text-xl animate-pulse">
                        {getChallengePrompt()}
                    </div>
                )}
                {areSuggestionsVisible && lastChunk?.suggestions && lastChunk.suggestions.length > 0 && !isLoading && !isListening && !lastChunk.challenge && (
                    <div className="pb-4">
                        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-3">
                            {lastChunk.suggestions?.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="font-semibold py-2 px-4 rounded-full border-2 bg-[--secondary-light] text-[--secondary-dark] border-[--secondary]"
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {isDldChallenge && wordBank.length > 0 && (
                    <div className="pb-4">
                        <p className="text-center text-sm font-bold text-gray-600 mb-2">✨ Your New Words! ✨</p>
                        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-3">
                            {wordBank.map((word, index) => (
                                <div key={index} className="font-semibold py-1 px-3 rounded-full bg-yellow-100 text-yellow-800 border-yellow-200 border">
                                    {word}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="max-w-2xl mx-auto flex flex-col items-center">
                  {isLoading ? (
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="mt-2 text-[--text-light]">Our storyteller is thinking...</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                        <button onClick={() => speakFromQueue([{text: (lastSpokenText || '').replace(/\*\*/g, '')}])} className="p-4 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors" aria-label="Repeat last sentence" disabled={isNarrating}>
                            <SpeakerIcon className="w-8 h-8 text-gray-700"/>
                        </button>
                        <button 
                          onClick={handleListen} 
                          disabled={isOnCooldown || isNarrating || isListening}
                          className={`p-5 rounded-full text-white transition-all duration-300 shadow-lg transform ${isListening ? 'bg-red-500 animate-pulse scale-110' : (isOnCooldown || isNarrating) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[--primary] hover:bg-[--primary-dark]'}`}
                          aria-label="Record your voice"
                        >
                          <MicrophoneIcon className="w-10 h-10" />
                        </button>
                        <div className="w-16 h-16"></div>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-[--text-light] min-h-[20px]">
                    {getFooterText()}
                  </p>
                </div>
            </>
        )}
      </footer>
    </div>
  );
};

export default StoryScreen;