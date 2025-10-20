import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Play, Pause, RotateCcw, Award, Star, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RhythmPattern {
  id: string;
  pattern: string;
  phrase: string;
  syllables: string[];
  bpm: number;
  level: string;
}

interface RhythmTrainingGameProps {
  gameData: {
    rhythmPatterns: RhythmPattern[];
  };
  sessionId: string;
  onComplete: (rewards: { xp: number; stars: number }) => void;
  onExit: () => void;
}

interface PatternAttempt {
  patternId: string;
  userTiming: number[];
  accuracy: number;
  completed: boolean;
}

export default function RhythmTrainingGame({
  gameData,
  sessionId,
  onComplete,
  onExit,
}: RhythmTrainingGameProps) {
  const { toast } = useToast();
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [beatIndex, setBeatIndex] = useState(0);
  const [attempts, setAttempts] = useState<PatternAttempt[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    accuracy: number;
    message: string;
  } | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  const currentPattern = gameData.rhythmPatterns[currentPatternIndex];
  const totalPatterns = gameData.rhythmPatterns.length;

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setTranscript(transcript);
        handleSpeechResult(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Please try again. Make sure your microphone is working.",
          variant: "destructive",
        });
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
    };
  }, []);

  // Play a beep sound
  const playBeep = (frequency: number = 800, duration: number = 0.1) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  // Play rhythm pattern
  const playPattern = () => {
    if (!currentPattern || isPlaying) return;

    setIsPlaying(true);
    setBeatIndex(0);

    const syllables = currentPattern.syllables;
    const beatDuration = 60000 / currentPattern.bpm; // milliseconds per beat

    let currentBeat = 0;

    const playNextBeat = () => {
      if (currentBeat >= syllables.length) {
        setIsPlaying(false);
        setBeatIndex(0);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        return;
      }

      playBeep();
      setBeatIndex(currentBeat);
      currentBeat++;

      timerRef.current = setTimeout(playNextBeat, beatDuration);
    };

    playNextBeat();
  };

  // Play phrase with speech synthesis
  const playPhrase = () => {
    if (!currentPattern) return;

    const utterance = new SpeechSynthesisUtterance(currentPattern.phrase);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // Start recording taps
  const startRecording = () => {
    setIsRecording(true);
    setUserTaps([]);
    recordingStartRef.current = Date.now();
    playBeep(600, 0.05); // Start sound
  };

  // Handle user tap
  const handleTap = () => {
    if (!isRecording) return;

    const tapTime = Date.now() - recordingStartRef.current;
    setUserTaps(prev => [...prev, tapTime]);
    playBeep(1000, 0.05); // Tap sound

    // Auto-complete after enough taps
    if (userTaps.length + 1 >= currentPattern.syllables.length) {
      setTimeout(() => stopRecording(), 100);
    }
  };

  // Stop recording and analyze
  const stopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);
    
    if (userTaps.length === 0) {
      toast({
        title: "No Taps Detected",
        description: "Please tap along with the rhythm pattern.",
        variant: "destructive",
      });
      return;
    }

    analyzeRhythm();
  };

  // Analyze rhythm accuracy
  const analyzeRhythm = () => {
    if (!currentPattern || userTaps.length === 0) return;

    const expectedInterval = 60000 / currentPattern.bpm;
    const expectedTaps = currentPattern.syllables.length;

    // Calculate intervals between taps
    const userIntervals: number[] = [];
    for (let i = 1; i < userTaps.length; i++) {
      userIntervals.push(userTaps[i] - userTaps[i - 1]);
    }

    // Calculate timing accuracy
    let totalError = 0;
    let validIntervals = 0;

    userIntervals.forEach(interval => {
      const error = Math.abs(interval - expectedInterval);
      const relativeError = error / expectedInterval;
      
      if (relativeError < 0.5) { // Within 50% tolerance
        totalError += relativeError;
        validIntervals++;
      }
    });

    // Calculate accuracy percentage
    const accuracy = validIntervals > 0
      ? Math.max(0, Math.min(100, (1 - totalError / validIntervals) * 100))
      : 0;

    // Check if number of taps is correct
    const tapCountAccuracy = Math.max(0, 100 - Math.abs(userTaps.length - expectedTaps) * 20);
    
    // Final accuracy combines timing and tap count
    const finalAccuracy = Math.round((accuracy * 0.7 + tapCountAccuracy * 0.3));

    const isCorrect = finalAccuracy >= 60;

    // Record attempt
    const attempt: PatternAttempt = {
      patternId: currentPattern.id,
      userTiming: userTaps,
      accuracy: finalAccuracy,
      completed: isCorrect,
    };

    setAttempts(prev => [...prev, attempt]);

    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy: finalAccuracy,
      message: isCorrect
        ? finalAccuracy >= 90
          ? "Perfect timing! 🎵"
          : "Great rhythm! 👏"
        : "Keep practicing! Try to match the beat. 🎯",
    });
    setShowFeedback(true);

    // Auto-advance after short delay
    if (isCorrect) {
      setTimeout(() => {
        nextPattern();
      }, 2000);
    }
  };

  // Start speech recognition
  const startListening = () => {
    if (!recognition || isListening) return;

    try {
      setTranscript('');
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: `Say the phrase: "${currentPattern.phrase}"`,
      });
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: "Error",
        description: "Could not start speech recognition.",
        variant: "destructive",
      });
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Handle speech result
  const handleSpeechResult = (spokenText: string) => {
    const expectedText = currentPattern.phrase.toLowerCase().trim();
    const similarity = calculateSimilarity(spokenText, expectedText);
    const accuracy = Math.round(similarity * 100);

    const isCorrect = accuracy >= 70;

    // Record attempt with speech
    const attempt: PatternAttempt = {
      patternId: currentPattern.id,
      userTiming: [], // No timing for speech
      accuracy: accuracy,
      completed: isCorrect,
    };

    setAttempts(prev => [...prev, attempt]);

    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy: accuracy,
      message: isCorrect
        ? accuracy >= 90
          ? "Perfect pronunciation! 🌟"
          : "Good job! 👍"
        : `Try again! You said: "${spokenText}"`,
    });
    setShowFeedback(true);

    if (isCorrect) {
      setTimeout(() => {
        nextPattern();
      }, 2000);
    }
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };

  // Levenshtein distance algorithm
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

  // Next pattern
  const nextPattern = () => {
    setShowFeedback(false);
    setFeedback(null);
    setUserTaps([]);
    setTranscript('');

    if (currentPatternIndex < totalPatterns - 1) {
      setCurrentPatternIndex(prev => prev + 1);
    } else {
      completeGame();
    }
  };

  // Retry current pattern
  const retryPattern = () => {
    setShowFeedback(false);
    setFeedback(null);
    setUserTaps([]);
    setTranscript('');
  };

  // Complete game
  const completeGame = async () => {
    const completedPatterns = attempts.filter(a => a.completed).length;
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
          score: completedPatterns * 100,
          accuracy: accuracy,
          gameData: {
            rhythmPatterns: attempts,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete game session');
      }

      const result = await response.json();

      toast({
        title: "Game Complete! 🎉",
        description: `You completed ${completedPatterns}/${totalPatterns} patterns with ${accuracy}% accuracy!`,
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

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'basic':
        return 'from-green-500 to-emerald-600';
      case 'intermediate':
        return 'from-blue-500 to-indigo-600';
      case 'advanced':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (!currentPattern) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading rhythm patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Rhythm Training 🎵
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pattern {currentPatternIndex + 1} / {totalPatterns}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {attempts.filter(a => a.completed).length} completed
            </p>
          </div>
        </div>

        {/* Pattern Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${getLevelColor(currentPattern.level)} rounded-2xl shadow-xl p-8 mb-6 text-white`}
        >
          <div className="text-center mb-6">
            <p className="text-sm uppercase tracking-wider mb-2 opacity-90">
              {currentPattern.level} Level
            </p>
            <h2 className="text-4xl font-bold mb-2">{currentPattern.pattern}</h2>
            <p className="text-xl opacity-90">{currentPattern.phrase}</p>
            <p className="text-sm mt-2 opacity-75">{currentPattern.bpm} BPM</p>
          </div>

          {/* Syllable Beats */}
          <div className="flex justify-center gap-3 mb-6">
            {currentPattern.syllables.map((syllable, index) => (
              <motion.div
                key={index}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                  beatIndex === index && isPlaying
                    ? 'bg-white text-purple-600 scale-125'
                    : 'bg-white/20 text-white'
                }`}
                animate={{
                  scale: beatIndex === index && isPlaying ? 1.25 : 1,
                }}
                transition={{ duration: 0.1 }}
              >
                {syllable}
              </motion.div>
            ))}
          </div>

          {/* Play Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={playPattern}
              disabled={isPlaying || isRecording}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Play Pattern
                </>
              )}
            </button>
            <button
              onClick={playPhrase}
              disabled={isPlaying || isRecording}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Volume2 className="w-5 h-5" />
              Hear Phrase
            </button>
          </div>
        </motion.div>

        {/* Practice Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Tap Method */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              👆 Tap the Rhythm
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Listen to the pattern, then tap the button to match the rhythm
            </p>
            
            {isRecording && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Recording... Tap {userTaps.length}/{currentPattern.syllables.length}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isPlaying || isListening}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Tapping
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTap}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-xl transition-all active:scale-95"
                  >
                    TAP HERE
                  </button>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Speech Method */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              🎤 Say the Phrase
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Speak the phrase with the correct rhythm and pronunciation
            </p>
            
            {isListening && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  🎤 Listening... Say: "{currentPattern.phrase}"
                </p>
              </div>
            )}

            {transcript && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">You said:</p>
                <p className="text-gray-800 dark:text-white font-medium">"{transcript}"</p>
              </div>
            )}

            <div className="flex gap-3">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={isPlaying || isRecording}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-5 h-5" />
                  Start Speaking
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  Stop
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentPatternIndex / totalPatterns) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentPatternIndex / totalPatterns) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full ${
                feedback.correct ? 'border-4 border-green-500' : 'border-4 border-orange-500'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mb-6"
                >
                  {feedback.correct ? (
                    <Award className="w-20 h-20 mx-auto text-green-500" />
                  ) : (
                    <RotateCcw className="w-20 h-20 mx-auto text-orange-500" />
                  )}
                </motion.div>

                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                  {feedback.message}
                </h3>

                <div className="flex items-center justify-center gap-1 mb-4">
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

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Accuracy: {feedback.accuracy}%
                </p>

                <div className="flex gap-3">
                  {!feedback.correct && (
                    <button
                      onClick={retryPattern}
                      className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      if (feedback.correct) {
                        nextPattern();
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
                  >
                    {currentPatternIndex < totalPatterns - 1 ? 'Next Pattern' : 'Complete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
