import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Star, 
  Check, 
  X, 
  ArrowRight,
  ArrowLeft,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Word {
  word: string;
  phonetic: string;
  phonemes: string[];
  difficulty: number;
  category: string;
}

interface WordPracticeGameProps {
  gameData: any;
  sessionId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function WordPracticeGame({ 
  gameData, 
  sessionId, 
  onComplete, 
  onExit 
}: WordPracticeGameProps) {
  const { toast } = useToast();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [score, setScore] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const words: Word[] = gameData?.words || [];
  const currentWord = words[currentWordIndex];

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 3;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const confidence = event.results[0][0].confidence;
        
        handleSpeechResult(transcript, confidence);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: "No speech detected",
            description: "Please try speaking louder",
            variant: "destructive"
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
        description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
        variant: "destructive"
      });
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSpeechResult = (transcript: string, confidence: number) => {
    const targetWord = currentWord.word.toLowerCase();
    const isCorrect = transcript === targetWord;
    
    // Calculate accuracy based on similarity and confidence
    let accuracy = 0;
    if (isCorrect) {
      accuracy = Math.round(confidence * 100);
    } else {
      // Partial credit for similar pronunciation
      const similarity = calculateSimilarity(transcript, targetWord);
      accuracy = Math.round(similarity * confidence * 100);
    }

    const attemptData = {
      word: currentWord.word,
      transcript,
      accuracy,
      correct: isCorrect,
      confidence,
      attempt: currentAttempt,
      timestamp: new Date()
    };

    setAttempts([...attempts, attemptData]);
    
    // Show feedback
    setFeedback({
      correct: isCorrect,
      accuracy,
      transcript,
      targetWord: currentWord.word
    });
    setShowFeedback(true);

    // Update score
    const newScore = score + accuracy;
    setScore(newScore);
    setTotalAccuracy(Math.round(newScore / ((currentWordIndex + 1) * 100) * 100));

    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowFeedback(false);
      
      if (currentAttempt < 2 && !isCorrect && accuracy < 70) {
        // Give another try
        setCurrentAttempt(currentAttempt + 1);
        toast({
          title: "Try again!",
          description: "Listen carefully and repeat the word",
        });
      } else {
        // Move to next word
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          // Game complete
          completeGame();
        }
      }
    }, 2500);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  };

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

  const playWordAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const completeGame = async () => {
    const gameData = {
      wordsAttempted: attempts.map(a => ({
        word: a.word,
        attempts: attempts.filter(att => att.word === a.word).length,
        accuracy: a.accuracy,
        phonemes: words.find(w => w.word === a.word)?.phonemes || [],
        timestamp: a.timestamp
      }))
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/games/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score,
          accuracy: totalAccuracy,
          gameData
        })
      });

      if (response.ok) {
        const results = await response.json();
        onComplete(results);
      }
    } catch (error) {
      console.error('Error completing game:', error);
      toast({
        title: "Error",
        description: "Failed to save game progress",
        variant: "destructive"
      });
    }
  };

  const skipWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentAttempt(1);
      setShowFeedback(false);
    } else {
      completeGame();
    }
  };

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl">Loading words...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-lg font-bold">
              {currentWordIndex + 1}/{words.length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-lg font-bold text-[#F5B82E]">
              {score}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Accuracy</div>
            <div className="text-lg font-bold text-[#F5B82E]">
              {totalAccuracy}%
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-8">
        <div 
          className="bg-[#F5B82E] h-2 rounded-full transition-all duration-500"
          style={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Main Word Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 mb-6"
        >
          {/* Word Display */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-24 h-24 rounded-full bg-[#F5B82E]/10 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#F5B82E]" />
              </div>
            </motion.div>
            
            <h2 className="text-5xl font-bold mb-3 text-foreground capitalize">
              {currentWord.word}
            </h2>
            
            <p className="text-2xl text-muted-foreground mb-2">
              {currentWord.phonetic}
            </p>
            
            <div className="inline-block px-4 py-2 bg-muted rounded-full">
              <span className="text-sm font-medium capitalize">{currentWord.category}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            <button
              onClick={playWordAudio}
              className="w-full bg-muted hover:bg-muted/80 text-foreground py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors"
            >
              <Volume2 className="w-6 h-6" />
              <span className="text-lg font-semibold">Listen to Word</span>
            </button>
            
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={showFeedback}
              className={`w-full py-5 px-6 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-[#F5B82E] to-orange-400 hover:shadow-lg text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-7 h-7" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7" />
                  Say the Word
                </>
              )}
            </button>

            {currentAttempt > 1 && (
              <div className="text-center text-sm text-muted-foreground">
                Attempt {currentAttempt} of 2
              </div>
            )}

            <button
              onClick={skipWord}
              className="w-full text-muted-foreground hover:text-foreground py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Skip this word →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-card border-2 rounded-2xl p-8 max-w-md w-full text-center ${
                feedback.correct 
                  ? 'border-green-500' 
                  : feedback.accuracy >= 70 
                    ? 'border-yellow-500' 
                    : 'border-red-500'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                {feedback.correct ? (
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                ) : feedback.accuracy >= 70 ? (
                  <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                    <Star className="w-10 h-10 text-yellow-500" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                )}
              </motion.div>

              <h3 className="text-2xl font-bold mb-2">
                {feedback.correct 
                  ? 'Perfect!' 
                  : feedback.accuracy >= 70 
                    ? 'Good Try!' 
                    : 'Keep Practicing!'}
              </h3>

              <p className="text-muted-foreground mb-4">
                You said: <span className="font-semibold text-foreground">"{feedback.transcript}"</span>
              </p>

              {!feedback.correct && (
                <p className="text-sm text-muted-foreground mb-4">
                  Target: <span className="font-semibold text-foreground capitalize">"{feedback.targetWord}"</span>
                </p>
              )}

              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      feedback.accuracy >= (i + 1) * 33
                        ? 'text-[#F5B82E] fill-[#F5B82E]'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <p className="text-3xl font-bold text-[#F5B82E]">
                +{feedback.accuracy} points
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
