import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';

interface PhonologicalGameProps {
  onComplete: (results: any) => void;
  userLevel: number;
}

export default function PhonologicalAwarenessGame({ onComplete, userLevel }: PhonologicalGameProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'instruction' | 'task' | 'feedback' | 'complete'>('instruction');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Evidence-based therapeutic tasks
  const tasks = [
    {
      id: '1',
      type: 'rhyme_detection',
      instruction: 'Do these words rhyme?',
      stimuli: { word1: 'cat', word2: 'hat', images: ['🐱', '👒'] },
      correct_answer: true,
      difficulty: 1
    },
    {
      id: '2',
      type: 'initial_sound',
      instruction: 'What sound does this word start with?',
      stimuli: { word: 'ball', image: '⚽', options: ['b', 'd', 'p'] },
      correct_answer: 'b',
      difficulty: 2
    },
    {
      id: '3',
      type: 'syllable_counting',
      instruction: 'How many syllables does this word have?',
      stimuli: { word: 'butterfly', image: '🦋', options: [1, 2, 3, 4] },
      correct_answer: 3,
      difficulty: 3
    },
    {
      id: '4',
      type: 'sound_blending',
      instruction: 'What word do these sounds make?',
      stimuli: { sounds: ['c', 'a', 't'], options: ['cat', 'cut', 'cot'] },
      correct_answer: 'cat',
      difficulty: 2
    }
  ];

  const currentTask = tasks[currentTaskIndex];

  const handleResponse = (response: any) => {
    const correct = response === currentTask.correct_answer;
    setIsCorrect(correct);
    
    const responseData = {
      taskId: currentTask.id,
      taskType: currentTask.type,
      userResponse: response,
      correctAnswer: currentTask.correct_answer,
      isCorrect: correct,
      reactionTime: 1500, // Simplified
      difficulty: currentTask.difficulty
    };
    
    setResponses(prev => [...prev, responseData]);
    setGameState('feedback');

    setTimeout(() => {
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
        setGameState('task');
        setIsCorrect(null);
      } else {
        setGameState('complete');
        completeGame();
      }
    }, 2000);
  };

  const completeGame = () => {
    const correctResponses = responses.filter(r => r.isCorrect).length;
    const accuracy = (correctResponses / responses.length) * 100;

    const results = {
      gameType: 'phonological_awareness',
      totalTasks: tasks.length,
      correctResponses,
      accuracy,
      responses,
      therapeuticData: {
        phonemeAwareness: accuracy,
        taskTypes: responses.map(r => r.taskType),
        difficultyLevels: responses.map(r => r.difficulty)
      }
    };

    onComplete(results);
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const renderTask = () => {
    switch (currentTask.type) {
      case 'rhyme_detection':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-6xl">{currentTask.stimuli.images[0]}</div>
              <div className="text-6xl">{currentTask.stimuli.images[1]}</div>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => playAudio(currentTask.stimuli.word1)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Volume2 className="w-4 h-4" />
                {currentTask.stimuli.word1}
              </button>
              <button
                onClick={() => playAudio(currentTask.stimuli.word2)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Volume2 className="w-4 h-4" />
                {currentTask.stimuli.word2}
              </button>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleResponse(true)}
                className="bg-green-500 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:bg-green-600 transition-colors"
              >
                Yes, they rhyme! ✓
              </button>
              <button
                onClick={() => handleResponse(false)}
                className="bg-red-500 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:bg-red-600 transition-colors"
              >
                No, they don't rhyme ✗
              </button>
            </div>
          </div>
        );

      case 'initial_sound':
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl mb-4">{currentTask.stimuli.image}</div>
            <div className="text-4xl font-bold mb-6">{currentTask.stimuli.word}</div>
            <button
              onClick={() => playAudio(currentTask.stimuli.word)}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg mx-auto mb-6 hover:bg-blue-600"
            >
              <Volume2 className="w-5 h-5" />
              Hear the word
            </button>
            <div className="flex justify-center gap-4">
              {currentTask.stimuli.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => handleResponse(option)}
                  className="bg-purple-500 text-white px-8 py-4 rounded-xl text-2xl font-bold hover:bg-purple-600 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'syllable_counting':
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl mb-4">{currentTask.stimuli.image}</div>
            <div className="text-4xl font-bold mb-6">{currentTask.stimuli.word}</div>
            <button
              onClick={() => playAudio(currentTask.stimuli.word)}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg mx-auto mb-6 hover:bg-blue-600"
            >
              <Volume2 className="w-5 h-5" />
              Hear the word
            </button>
            <div className="text-lg mb-4">Clap for each syllable!</div>
            <div className="flex justify-center gap-4">
              {currentTask.stimuli.options.map((option: number) => (
                <button
                  key={option}
                  onClick={() => handleResponse(option)}
                  className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold hover:bg-orange-600 transition-colors"
                >
                  {option} {option === 1 ? 'clap' : 'claps'}
                </button>
              ))}
            </div>
          </div>
        );

      case 'sound_blending':
        return (
          <div className="text-center space-y-6">
            <div className="text-2xl mb-6">Listen to each sound:</div>
            <div className="flex justify-center gap-4 mb-8">
              {currentTask.stimuli.sounds.map((sound: string, index: number) => (
                <button
                  key={index}
                  onClick={() => playAudio(sound)}
                  className="bg-teal-500 text-white px-6 py-4 rounded-xl text-2xl font-bold hover:bg-teal-600 transition-colors"
                >
                  {sound}
                </button>
              ))}
            </div>
            <div className="text-lg mb-6">What word do they make together?</div>
            <div className="flex justify-center gap-4">
              {currentTask.stimuli.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => handleResponse(option)}
                  className="bg-indigo-500 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:bg-indigo-600 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentTaskIndex + 1} of {tasks.length}</span>
            <span>{Math.round(((currentTaskIndex) / tasks.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentTaskIndex) / tasks.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'instruction' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-6 text-blue-600">
                🧩 Phonological Awareness Game
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                We're going to play with sounds and words! Listen carefully and choose the right answer.
              </p>
              <button
                onClick={() => setGameState('task')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Let's Start! 🚀
              </button>
            </motion.div>
          )}

          {gameState === 'task' && (
            <motion.div
              key={currentTaskIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-2xl font-semibold text-center mb-8 text-foreground">
                {currentTask.instruction}
              </h3>
              {renderTask()}
            </motion.div>
          )}

          {gameState === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className={`text-8xl mb-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? <CheckCircle className="w-20 h-20 mx-auto" /> : <XCircle className="w-20 h-20 mx-auto" />}
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? 'Excellent! 🌟' : 'Good try! 💪'}
              </h3>
              <p className="text-lg text-muted-foreground">
                {isCorrect 
                  ? 'You got it right! Great job listening!' 
                  : `The correct answer was: ${currentTask.correct_answer}`
                }
              </p>
            </motion.div>
          )}

          {gameState === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-3xl font-bold mb-4 text-green-600">
                Amazing Work!
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                You completed the Phonological Awareness game!
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {responses.filter(r => r.isCorrect).length} out of {responses.length} correct!
                </div>
                <div className="text-muted-foreground">
                  You're getting better at listening to sounds in words!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}