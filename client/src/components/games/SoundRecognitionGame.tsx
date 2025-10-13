import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Check, 
  X, 
  Star,
  ArrowLeft,
  Award,
  Headphones,
  PlayCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Sound {
  sound: string;
  example: string;
  audioKey: string;
  category: string;
}

interface SoundRecognitionGameProps {
  gameData: any;
  sessionId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function SoundRecognitionGame({ 
  gameData, 
  sessionId, 
  onComplete, 
  onExit 
}: SoundRecognitionGameProps) {
  const { toast } = useToast();
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Combine phonemes and vowels
  const allSounds: Sound[] = [
    ...(gameData?.phonemes || []),
    ...(gameData?.vowels || [])
  ];

  // Shuffle sounds and take 10 for the session
  const [sessionSounds] = useState(() => {
    const shuffled = [...allSounds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });

  const currentSound = sessionSounds[currentSoundIndex];

  // Generate multiple choice options
  const [options, setOptions] = useState<Sound[]>([]);

  useEffect(() => {
    if (currentSound) {
      generateOptions();
      setHasPlayed(false);
      setSelectedAnswer(null);
    }
  }, [currentSoundIndex]);

  const generateOptions = () => {
    const otherSounds = allSounds.filter(s => s.sound !== currentSound.sound);
    const shuffled = [...otherSounds].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3);
    
    const allOptions = [currentSound, ...wrongOptions];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    setOptions(shuffledOptions);
  };

  const playSound = () => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      // Create utterance for the example word
      const utterance = new SpeechSynthesisUtterance(currentSound.example);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Emphasize the target sound
      speechSynthesis.speak(utterance);
      setHasPlayed(true);
    } else {
      toast({
        title: "Audio Not Supported",
        description: "Your browser doesn't support audio playback",
        variant: "destructive"
      });
    }
  };

  const handleAnswer = (selected: Sound) => {
    if (selectedAnswer || showFeedback) return;
    
    const isCorrect = selected.sound === currentSound.sound;
    setSelectedAnswer(selected.sound);
    
    // Calculate score
    const points = isCorrect ? 100 : 0;
    const attemptData = {
      sound: currentSound.sound,
      correct: isCorrect,
      selectedSound: selected.sound,
      category: currentSound.category,
      timestamp: new Date()
    };

    setAttempts([...attempts, attemptData]);
    setScore(score + points);

    // Show feedback
    setFeedback({
      correct: isCorrect,
      correctSound: currentSound.sound,
      correctExample: currentSound.example,
      selectedExample: selected.example,
      category: currentSound.category
    });
    setShowFeedback(true);

    // Auto-advance after feedback
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      if (currentSoundIndex < sessionSounds.length - 1) {
        setCurrentSoundIndex(currentSoundIndex + 1);
      } else {
        completeGame();
      }
    }, 2500);
  };

  const completeGame = async () => {
    const correctAnswers = attempts.filter(a => a.correct).length + (feedback?.correct ? 1 : 0);
    const totalQuestions = sessionSounds.length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

    const gameData = {
      soundsIdentified: attempts.map(a => ({
        sound: a.sound,
        correct: a.correct,
        responseTime: 0, // Could track this if needed
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
          accuracy,
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

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'plosive': return 'bg-blue-500/10 text-blue-500';
      case 'nasal': return 'bg-green-500/10 text-green-500';
      case 'fricative': return 'bg-purple-500/10 text-purple-500';
      case 'approximant': return 'bg-orange-500/10 text-orange-500';
      case 'lateral': return 'bg-pink-500/10 text-pink-500';
      case 'long_vowel': return 'bg-cyan-500/10 text-cyan-500';
      case 'short_vowel': return 'bg-yellow-500/10 text-yellow-500';
      case 'diphthong': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!currentSound) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl">Loading sounds...</p>
        </div>
      </div>
    );
  }

  const correctAnswers = attempts.filter(a => a.correct).length;
  const totalAccuracy = attempts.length > 0 ? Math.round((correctAnswers / attempts.length) * 100) : 0;

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
              {currentSoundIndex + 1}/{sessionSounds.length}
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
          style={{ width: `${((currentSoundIndex + 1) / sessionSounds.length) * 100}%` }}
        />
      </div>

      {/* Main Sound Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSoundIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 mb-6"
        >
          {/* Sound Display */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-24 h-24 rounded-full bg-[#F5B82E]/10 flex items-center justify-center">
                <Headphones className="w-12 h-12 text-[#F5B82E]" />
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              Listen to the sound
            </h2>
            
            <p className="text-muted-foreground mb-4">
              Which sound do you hear?
            </p>
            
            <div className={`inline-block px-4 py-2 rounded-full mb-6 ${getCategoryColor(currentSound.category)}`}>
              <span className="text-sm font-medium capitalize">{currentSound.category.replace('_', ' ')}</span>
            </div>

            {/* Play Button */}
            <button
              onClick={playSound}
              disabled={showFeedback}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-[#F5B82E] to-orange-400 hover:shadow-lg text-white py-5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-7 h-7" />
              <span className="text-lg font-bold">
                {hasPlayed ? 'Play Again' : 'Play Sound'}
              </span>
            </button>

            {!hasPlayed && (
              <p className="text-sm text-muted-foreground mt-3">
                Click to hear the sound example
              </p>
            )}
          </div>

          {/* Options */}
          {hasPlayed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 max-w-2xl mx-auto"
            >
              {options.map((option, index) => (
                <motion.button
                  key={option.sound}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedAnswer === option.sound
                      ? option.sound === currentSound.sound
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-red-500 bg-red-500/10'
                      : 'border-border bg-card hover:border-[#F5B82E] hover:bg-[#F5B82E]/5'
                  } disabled:cursor-not-allowed`}
                >
                  <div className="text-3xl font-bold mb-2">{option.sound}</div>
                  <div className="text-sm text-muted-foreground">as in "{option.example}"</div>
                </motion.button>
              ))}
            </motion.div>
          )}
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
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                )}
              </motion.div>

              <h3 className="text-2xl font-bold mb-2">
                {feedback.correct ? 'Correct!' : 'Not Quite!'}
              </h3>

              {!feedback.correct && (
                <div className="mb-4">
                  <p className="text-muted-foreground mb-2">
                    The correct sound was:
                  </p>
                  <div className="text-3xl font-bold mb-1">{feedback.correctSound}</div>
                  <p className="text-sm text-muted-foreground">
                    as in "{feedback.correctExample}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      feedback.correct
                        ? 'text-[#F5B82E] fill-[#F5B82E]'
                        : i === 0
                          ? 'text-[#F5B82E] fill-[#F5B82E]'
                          : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <p className="text-3xl font-bold text-[#F5B82E]">
                +{feedback.correct ? 100 : 0} points
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
