import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Check, 
  X, 
  Star,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WordBlock {
  text: string;
  type: string;
  options: string[];
}

interface Template {
  pattern: string;
  example: string;
  words: WordBlock[];
}

interface SentenceBuildingGameProps {
  gameData: any;
  sessionId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function SentenceBuildingGame({ 
  gameData, 
  sessionId, 
  onComplete, 
  onExit 
}: SentenceBuildingGameProps) {
  const { toast } = useToast();
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Selected words for current sentence
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [builtSentence, setBuiltSentence] = useState('');

  const templates: Template[] = gameData?.templates || [];
  const currentTemplate = templates[currentTemplateIndex];

  // Initialize selected words with first option of each word block
  useEffect(() => {
    if (currentTemplate) {
      const initial = currentTemplate.words.map(w => w.options[0]);
      setSelectedWords(initial);
      updateSentence(initial);
    }
  }, [currentTemplateIndex]);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
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
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const updateSentence = (words: string[]) => {
    const sentence = words.join(' ');
    setBuiltSentence(sentence);
  };

  const handleWordSelect = (blockIndex: number, word: string) => {
    const newWords = [...selectedWords];
    newWords[blockIndex] = word;
    setSelectedWords(newWords);
    updateSentence(newWords);
  };

  const shuffleWords = () => {
    const shuffled = currentTemplate.words.map(block => {
      const randomIndex = Math.floor(Math.random() * block.options.length);
      return block.options[randomIndex];
    });
    setSelectedWords(shuffled);
    updateSentence(shuffled);
  };

  const playSentence = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(builtSentence);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

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
    const targetSentence = builtSentence.toLowerCase();
    
    // Calculate similarity
    const similarity = calculateSimilarity(transcript, targetSentence);
    const accuracy = Math.round(similarity * confidence * 100);
    const isCorrect = accuracy >= 70;

    const attemptData = {
      sentence: builtSentence,
      transcript,
      accuracy,
      grammarScore: 100, // Since we built it correctly
      timestamp: new Date()
    };

    setAttempts([...attempts, attemptData]);
    
    const points = Math.max(50, accuracy);
    setScore(score + points);

    setFeedback({
      correct: isCorrect,
      accuracy,
      transcript,
      targetSentence: builtSentence,
      points
    });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      
      if (currentTemplateIndex < templates.length - 1) {
        setCurrentTemplateIndex(currentTemplateIndex + 1);
      } else {
        completeGame();
      }
    }, 3000);
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

  const completeGame = async () => {
    const totalAccuracy = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)
      : 0;

    const gameData = {
      sentencesCompleted: attempts.map(a => ({
        sentence: a.sentence,
        accuracy: a.accuracy,
        grammarScore: a.grammarScore,
        timestamp: a.timestamp
      }))
    };

    try {
      const response = await fetch(`/api/games/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
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

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'subject': return 'bg-blue-500/10 text-blue-500 border-blue-500';
      case 'verb': return 'bg-green-500/10 text-green-500 border-green-500';
      case 'object': return 'bg-purple-500/10 text-purple-500 border-purple-500';
      case 'adjective': return 'bg-orange-500/10 text-orange-500 border-orange-500';
      case 'adverb': return 'bg-pink-500/10 text-pink-500 border-pink-500';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl">Loading sentences...</p>
        </div>
      </div>
    );
  }

  const totalAccuracy = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4">
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
              {currentTemplateIndex + 1}/{templates.length}
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
          style={{ width: `${((currentTemplateIndex + 1) / templates.length) * 100}%` }}
        />
      </div>

      {/* Main Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTemplateIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 mb-6"
        >
          {/* Instructions */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-[#F5B82E]/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#F5B82E]" />
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2">Build a Sentence!</h2>
            <p className="text-muted-foreground mb-4">
              Choose words to create a proper sentence
            </p>
            <p className="text-sm text-muted-foreground">
              Example: {currentTemplate.example}
            </p>
          </div>

          {/* Word Blocks */}
          <div className="space-y-6 mb-8">
            {currentTemplate.words.map((block, blockIndex) => (
              <div key={blockIndex}>
                <div className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                  {block.type}:
                </div>
                <div className="flex flex-wrap gap-3">
                  {block.options.map((option, optionIndex) => (
                    <motion.button
                      key={optionIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: blockIndex * 0.1 + optionIndex * 0.05 }}
                      onClick={() => handleWordSelect(blockIndex, option)}
                      className={`px-6 py-3 rounded-xl border-2 transition-all ${
                        selectedWords[blockIndex] === option
                          ? `${getTypeColor(block.type)} scale-105 shadow-md`
                          : 'border-border bg-card hover:border-[#F5B82E]/50'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Built Sentence Display */}
          <div className="bg-muted/30 rounded-xl p-6 mb-6">
            <div className="text-sm text-muted-foreground mb-2">Your Sentence:</div>
            <div className="text-2xl font-bold text-foreground min-h-[40px] flex items-center">
              {builtSentence || 'Select words to build your sentence...'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={shuffleWords}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Random Words
              </button>
              
              <button
                onClick={playSentence}
                disabled={!builtSentence}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Volume2 className="w-5 h-5" />
                Listen
              </button>
            </div>

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={showFeedback || !builtSentence}
              className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-[#F5B82E] to-orange-400 hover:shadow-lg text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  Say Your Sentence
                </>
              )}
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
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className={`bg-card border-2 rounded-2xl p-8 max-w-lg w-full text-center ${
                feedback.correct 
                  ? 'border-green-500' 
                  : feedback.accuracy >= 50
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
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                    <Star className="w-10 h-10 text-yellow-500" />
                  </div>
                )}
              </motion.div>

              <h3 className="text-2xl font-bold mb-3">
                {feedback.correct ? 'Excellent!' : 'Good Try!'}
              </h3>

              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-1">You said:</p>
                <p className="font-semibold text-foreground mb-3">"{feedback.transcript}"</p>
                
                {!feedback.correct && (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">Target:</p>
                    <p className="font-semibold text-foreground">"{feedback.targetSentence}"</p>
                  </>
                )}
              </div>

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
                +{feedback.points} points
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
