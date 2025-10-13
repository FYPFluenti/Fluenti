import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mic, Volume2, Timer, Award, Star, Home, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickSound {
  id: string;
  sound: string;
  phonetic: string;
  difficulty: string;
  timeLimit: number;
}

interface QuickSoundsGameProps {
  gameData: {
    quickSounds: QuickSound[];
  };
  sessionId: string;
  onComplete: (rewards: { xp: number; stars: number }) => void;
  onExit: () => void;
}

interface SoundAttempt {
  soundId: string;
  sound: string;
  transcript: string;
  accuracy: number;
  timeUsed: number;
  success: boolean;
}

export default function QuickSoundsGame({
  gameData,
  sessionId,
  onComplete,
  onExit,
}: QuickSoundsGameProps) {
  const { toast } = useToast();
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [attempts, setAttempts] = useState<SoundAttempt[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    accuracy: number;
    timeUsed: number;
    message: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentSound = gameData.quickSounds[currentSoundIndex];
  const totalSounds = gameData.quickSounds.length;

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleSpeechResult(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'no-speech') {
          toast({
            title: "Speech Recognition Error",
            description: "Please try again quickly!",
            variant: "destructive",
          });
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start timer for current sound
  useEffect(() => {
    if (currentSound && !isTimerActive) {
      setTimeLeft(currentSound.timeLimit);
      setIsTimerActive(true);
      startTimeRef.current = Date.now();
    }
  }, [currentSound]);

  // Timer countdown
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 10);
      }, 10);
    } else if (isTimerActive && timeLeft <= 0) {
      handleTimeout();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive]);

  // Play sound audio
  const playSound = () => {
    if (!currentSound) return;

    const utterance = new SpeechSynthesisUtterance(currentSound.sound);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Start listening
  const startListening = () => {
    if (!recognition || isListening || !isTimerActive) return;

    try {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Handle speech result
  const handleSpeechResult = (spokenText: string) => {
    if (!isTimerActive) return;

    setIsTimerActive(false);
    stopListening();

    const timeUsed = Date.now() - startTimeRef.current;
    const expectedText = currentSound.sound.toLowerCase().trim();
    const similarity = calculateSimilarity(spokenText.toLowerCase().trim(), expectedText);
    const accuracy = Math.round(similarity * 100);

    const isCorrect = accuracy >= 70;
    const timeBonus = isCorrect ? Math.max(0, Math.floor((currentSound.timeLimit - timeUsed) / 100)) : 0;
    const accuracyScore = isCorrect ? Math.floor(accuracy) : 0;
    const comboBonus = isCorrect ? combo * 10 : 0;
    const pointsEarned = accuracyScore + timeBonus + comboBonus;

    // Record attempt
    const attempt: SoundAttempt = {
      soundId: currentSound.id,
      sound: currentSound.sound,
      transcript: spokenText,
      accuracy: accuracy,
      timeUsed: timeUsed,
      success: isCorrect,
    };

    setAttempts(prev => [...prev, attempt]);

    if (isCorrect) {
      setScore(prev => prev + pointsEarned);
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }

    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy: accuracy,
      timeUsed: timeUsed,
      message: isCorrect
        ? combo >= 2
          ? `🔥 ${combo + 1}x Combo! +${pointsEarned} points!`
          : `Great! +${pointsEarned} points!`
        : `Too slow or incorrect! You said: "${spokenText}"`,
    });
    setShowFeedback(true);

    setTimeout(() => {
      nextSound();
    }, 1500);
  };

  // Handle timeout
  const handleTimeout = () => {
    setIsTimerActive(false);
    stopListening();
    setCombo(0);

    const attempt: SoundAttempt = {
      soundId: currentSound.id,
      sound: currentSound.sound,
      transcript: '(timeout)',
      accuracy: 0,
      timeUsed: currentSound.timeLimit,
      success: false,
    };

    setAttempts(prev => [...prev, attempt]);

    setFeedback({
      correct: false,
      accuracy: 0,
      timeUsed: currentSound.timeLimit,
      message: `Time's up! ⏰`,
    });
    setShowFeedback(true);

    setTimeout(() => {
      nextSound();
    }, 1500);
  };

  // Calculate similarity
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };

  // Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Next sound
  const nextSound = () => {
    setShowFeedback(false);
    setFeedback(null);
    setTranscript('');

    if (currentSoundIndex < totalSounds - 1) {
      setCurrentSoundIndex(prev => prev + 1);
      setIsTimerActive(false);
    } else {
      completeGame();
    }
  };

  // Complete game
  const completeGame = async () => {
    const successfulAttempts = attempts.filter(a => a.success).length;
    const totalAccuracy = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length
      : 0;

    const accuracy = Math.round(totalAccuracy);

    try {
      const response = await fetch(`/api/games/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          score: score,
          accuracy: accuracy,
          gameData: {
            quickSounds: attempts,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete game session');
      }

      const result = await response.json();

      toast({
        title: "Game Complete! ⚡",
        description: `Score: ${score} | ${successfulAttempts}/${totalSounds} correct with ${accuracy}% accuracy!`,
      });

      onComplete(result.rewards);
    } catch (error) {
      console.error('Error completing game:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress.",
        variant: "destructive",
      });
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-yellow-500 to-orange-600';
      case 'hard':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (!currentSound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading sounds...</p>
        </div>
      </div>
    );
  }

  const timePercentage = (timeLeft / currentSound.timeLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
            >
              <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Zap className="w-7 h-7 text-yellow-500" />
              Quick Sounds
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              🏆 {score}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {combo > 0 && `🔥 ${combo}x Combo`}
            </p>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="mb-6">
          <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`absolute left-0 top-0 h-full ${
                timePercentage > 50
                  ? 'bg-green-500'
                  : timePercentage > 25
                  ? 'bg-yellow-500'
                  : 'bg-red-500 animate-pulse'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${timePercentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-center text-sm mt-1 text-gray-600 dark:text-gray-400">
            {(timeLeft / 1000).toFixed(2)}s remaining
          </p>
        </div>

        {/* Sound Display */}
        <motion.div
          key={currentSoundIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-r ${getDifficultyColor(currentSound.difficulty)} rounded-3xl shadow-2xl p-12 mb-6 text-white relative overflow-hidden`}
        >
          {/* Background Animation */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative text-center">
            <p className="text-sm uppercase tracking-wider mb-2 opacity-90">
              {currentSound.difficulty} • Sound {currentSoundIndex + 1}/{totalSounds}
            </p>
            <motion.h2
              className="text-8xl font-bold mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              {currentSound.sound}
            </motion.h2>
            <p className="text-3xl opacity-90 mb-6">{currentSound.phonetic}</p>

            <button
              onClick={playSound}
              className="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-full flex items-center gap-3 mx-auto transition-all backdrop-blur-sm"
            >
              <Volume2 className="w-6 h-6" />
              <span className="font-semibold text-lg">Hear Sound</span>
            </button>
          </div>
        </motion.div>

        {/* Microphone Button */}
        <motion.div
          className="flex justify-center mb-6"
          animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
        >
          {!isListening ? (
            <button
              onClick={startListening}
              disabled={!isTimerActive}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-16 h-16 text-white" />
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl flex items-center justify-center animate-pulse"
            >
              <Mic className="w-16 h-16 text-white" />
            </button>
          )}
        </motion.div>

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">You said:</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white text-center">
              "{transcript}"
            </p>
          </motion.div>
        )}

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentSoundIndex + 1} / {totalSounds}
            </span>
          </div>
          <div className="flex gap-2">
            {gameData.quickSounds.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-all ${
                  index < currentSoundIndex
                    ? attempts[index]?.success
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : index === currentSoundIndex
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              ✓ {attempts.filter(a => a.success).length} correct
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {attempts.filter(a => !a.success).length} missed
            </span>
          </div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            ⚡ Say the sound as fast and accurately as possible!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            🔥 Build combos for bonus points • ⏱️ Beat the clock for time bonus
          </p>
        </motion.div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full ${
                feedback.correct ? 'border-4 border-green-500' : 'border-4 border-red-500'
              }`}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mb-4"
                >
                  {feedback.correct ? (
                    <Trophy className="w-20 h-20 mx-auto text-green-500" />
                  ) : (
                    <Timer className="w-20 h-20 mx-auto text-red-500" />
                  )}
                </motion.div>

                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                  {feedback.message}
                </h3>

                {feedback.correct && (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${
                            star <= Math.ceil(feedback.accuracy / 33)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                      Accuracy: {feedback.accuracy}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Time: {(feedback.timeUsed / 1000).toFixed(2)}s
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
