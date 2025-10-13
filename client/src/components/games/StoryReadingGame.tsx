import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mic, Volume2, ChevronRight, Award, Star, Home, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  title: string;
  level: string;
  sentences: string[];
  comprehensionQuestions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

interface StoryReadingGameProps {
  gameData: {
    stories: Story[];
  };
  sessionId: string;
  onComplete: (rewards: { xp: number; stars: number }) => void;
  onExit: () => void;
}

interface SentenceAttempt {
  sentence: string;
  transcript: string;
  accuracy: number;
}

interface StoryProgress {
  storyId: string;
  sentencesRead: SentenceAttempt[];
  questionsAnswered: {
    question: string;
    userAnswer: number;
    correctAnswer: number;
    correct: boolean;
  }[];
  completed: boolean;
}

export default function StoryReadingGame({
  gameData,
  sessionId,
  onComplete,
  onExit,
}: StoryReadingGameProps) {
  const { toast } = useToast();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isReading, setIsReading] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [storyProgress, setStoryProgress] = useState<StoryProgress[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<SentenceAttempt[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    accuracy: number;
    message: string;
  } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<any[]>([]);

  const currentStory = gameData.stories[currentStoryIndex];
  const totalStories = gameData.stories.length;
  const isLastSentence = currentSentenceIndex >= currentStory.sentences.length - 1;
  const currentSentence = currentStory.sentences[currentSentenceIndex];

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

  // Play sentence audio
  const playSentence = () => {
    if (!currentSentence) return;

    const utterance = new SpeechSynthesisUtterance(currentSentence);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Start listening
  const startListening = () => {
    if (!recognition || isListening) return;

    try {
      setTranscript('');
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Read the sentence out loud.",
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

  // Stop listening
  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Handle speech result
  const handleSpeechResult = (spokenText: string) => {
    const expectedText = currentSentence.toLowerCase().trim();
    const similarity = calculateSimilarity(spokenText.toLowerCase().trim(), expectedText);
    const accuracy = Math.round(similarity * 100);

    // Record attempt
    const attempt: SentenceAttempt = {
      sentence: currentSentence,
      transcript: spokenText,
      accuracy: accuracy,
    };

    setCurrentAttempts(prev => [...prev, attempt]);

    const isCorrect = accuracy >= 70;

    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy: accuracy,
      message: isCorrect
        ? accuracy >= 90
          ? "Excellent reading! 🌟"
          : "Good job! 👍"
        : `Keep trying! You said: "${spokenText}"`,
    });
    setShowFeedback(true);

    if (isCorrect) {
      setTimeout(() => {
        nextSentence();
      }, 1500);
    }
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

  // Next sentence
  const nextSentence = () => {
    setShowFeedback(false);
    setFeedback(null);
    setTranscript('');

    if (currentSentenceIndex < currentStory.sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    } else {
      // Story reading complete, move to comprehension
      setIsReading(false);
      setCurrentQuestionIndex(0);
    }
  };

  // Skip sentence (for testing)
  const skipSentence = () => {
    const attempt: SentenceAttempt = {
      sentence: currentSentence,
      transcript: '(skipped)',
      accuracy: 0,
    };
    setCurrentAttempts(prev => [...prev, attempt]);
    nextSentence();
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  // Submit answer
  const submitAnswer = () => {
    if (selectedAnswer === null) {
      toast({
        title: "No Answer Selected",
        description: "Please select an answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    const question = currentStory.comprehensionQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    const answeredQuestion = {
      question: question.question,
      userAnswer: selectedAnswer,
      correctAnswer: question.correctAnswer,
      correct: isCorrect,
    };

    setAnsweredQuestions(prev => [...prev, answeredQuestion]);

    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy: isCorrect ? 100 : 0,
      message: isCorrect
        ? "Correct! Great comprehension! 🎉"
        : `Not quite. The correct answer was: ${question.options[question.correctAnswer]}`,
    });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setSelectedAnswer(null);

      if (currentQuestionIndex < currentStory.comprehensionQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Story complete
        completeStory();
      }
    }, 2000);
  };

  // Complete current story
  const completeStory = () => {
    const progress: StoryProgress = {
      storyId: currentStory.id,
      sentencesRead: currentAttempts,
      questionsAnswered: answeredQuestions,
      completed: true,
    };

    setStoryProgress(prev => [...prev, progress]);

    if (currentStoryIndex < totalStories - 1) {
      // Move to next story
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentSentenceIndex(0);
      setCurrentAttempts([]);
      setAnsweredQuestions([]);
      setIsReading(true);
    } else {
      // All stories complete
      completeGame();
    }
  };

  // Complete game
  const completeGame = async () => {
    // Calculate overall accuracy
    const readingAccuracy = currentAttempts.length > 0
      ? currentAttempts.reduce((sum, a) => sum + a.accuracy, 0) / currentAttempts.length
      : 0;

    const comprehensionAccuracy = answeredQuestions.length > 0
      ? (answeredQuestions.filter(q => q.correct).length / answeredQuestions.length) * 100
      : 0;

    const overallAccuracy = Math.round((readingAccuracy * 0.6 + comprehensionAccuracy * 0.4));

    const allProgress = [...storyProgress, {
      storyId: currentStory.id,
      sentencesRead: currentAttempts,
      questionsAnswered: answeredQuestions,
      completed: true,
    }];

    try {
      const response = await fetch(`/api/games/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          score: allProgress.length * 100,
          accuracy: overallAccuracy,
          gameData: {
            storiesRead: allProgress,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete game session');
      }

      const result = await response.json();

      toast({
        title: "Game Complete! 🎉",
        description: `You completed ${allProgress.length}/${totalStories} stories with ${overallAccuracy}% accuracy!`,
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
      case 'easy':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-blue-500 to-indigo-600';
      case 'hard':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900 p-6">
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
              Story Reading 📚
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Story {currentStoryIndex + 1} / {totalStories}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {storyProgress.length} completed
            </p>
          </div>
        </div>

        {/* Story Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${getLevelColor(currentStory.level)} rounded-2xl shadow-xl p-8 mb-6 text-white`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-wider mb-1 opacity-90">
                {currentStory.level} Level
              </p>
              <h2 className="text-3xl font-bold">{currentStory.title}</h2>
            </div>
            <BookOpen className="w-12 h-12 opacity-90" />
          </div>
        </motion.div>

        {isReading ? (
          /* Reading Phase */
          <div className="space-y-6">
            {/* Sentence Display */}
            <motion.div
              key={currentSentenceIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Sentence {currentSentenceIndex + 1} of {currentStory.sentences.length}
                </p>
                <p className="text-2xl text-gray-800 dark:text-white leading-relaxed">
                  {currentSentence}
                </p>
              </div>

              {transcript && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You read:</p>
                  <p className="text-lg text-gray-800 dark:text-white">"{transcript}"</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-3">
                <button
                  onClick={playSentence}
                  disabled={isListening}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Volume2 className="w-5 h-5" />
                  Listen
                </button>
                
                {!isListening ? (
                  <button
                    onClick={startListening}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Mic className="w-5 h-5" />
                    Read Aloud
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    Listening...
                  </button>
                )}

                <button
                  onClick={skipSentence}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                >
                  Skip
                </button>
              </div>
            </motion.div>

            {/* Sentences Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 flex-wrap">
                {currentStory.sentences.map((_, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      index < currentSentenceIndex
                        ? 'bg-green-500 text-white'
                        : index === currentSentenceIndex
                        ? 'bg-blue-500 text-white scale-110'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {index < currentSentenceIndex ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Comprehension Phase */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              Comprehension Questions
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Question {currentQuestionIndex + 1} of {currentStory.comprehensionQuestions.length}
            </p>

            <div className="mb-8">
              <p className="text-xl text-gray-800 dark:text-white mb-6">
                {currentStory.comprehensionQuestions[currentQuestionIndex].question}
              </p>

              <div className="space-y-3">
                {currentStory.comprehensionQuestions[currentQuestionIndex].options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedAnswer === index
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <p className="text-gray-800 dark:text-white font-medium">{option}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Submit Answer
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentStoryIndex / totalStories) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStoryIndex / totalStories) * 100}%` }}
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
                    <BookOpen className="w-20 h-20 mx-auto text-orange-500" />
                  )}
                </motion.div>

                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                  {feedback.message}
                </h3>

                {isReading && (
                  <>
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

                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Accuracy: {feedback.accuracy}%
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
