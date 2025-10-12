import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';

interface InterestsSelectionScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

const interestOptions = [
  { id: 'animals', name: 'Animals', icon: '🦁', color: 'from-emerald-400 to-emerald-600' },
  { id: 'nature', name: 'Nature', icon: '🌳', color: 'from-blue-400 to-blue-600' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', color: 'from-amber-400 to-amber-600' },
  { id: 'books', name: 'Books', icon: '📚', color: 'from-purple-400 to-purple-600' },
  { id: 'dinosaurs', name: 'Dinosaurs', icon: '🦕', color: 'from-lime-400 to-lime-600' },
  { id: 'music', name: 'Music', icon: '🎵', color: 'from-pink-400 to-pink-600' },
  { id: 'space', name: 'Space', icon: '🚀', color: 'from-indigo-400 to-indigo-600' },
  { id: 'robots', name: 'Robots', icon: '🤖', color: 'from-cyan-400 to-cyan-600' },
  { id: 'colors', name: 'Colors', icon: '🎨', color: 'from-rose-400 to-rose-600' },
  { id: 'numbers', name: 'Numbers', icon: '🔢', color: 'from-violet-400 to-violet-600' },
  { id: 'shapes', name: 'Shapes', icon: '🔶', color: 'from-sky-400 to-sky-600' },
  { id: 'food', name: 'Food', icon: '🍎', color: 'from-orange-400 to-orange-600' },
  { id: 'jobs', name: 'Jobs', icon: '👨‍🚒', color: 'from-red-400 to-red-600' },
];

export default function InterestsSelectionScreen({ data, onNext, onBack, onSkip }: InterestsSelectionScreenProps) {
  const childName = data.childName || 'your child';
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || []);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = () => {
    onNext({ interests: selectedInterests });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <Heart className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          <span className="text-[#F5B82E]">{childName}'s</span> favorite things?
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Pick {childName === 'your child' ? 'your child' : childName}'s favorite topics and help us personalize their experience!
        </p>

        {/* Interests Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {interestOptions.map((interest, index) => (
            <motion.button
              key={interest.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleInterestToggle(interest.id)}
              className={`relative p-6 rounded-2xl transition-all duration-200 ${
                selectedInterests.includes(interest.id)
                  ? `bg-gradient-to-br ${interest.color} text-white shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {selectedInterests.includes(interest.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <span className="text-green-500 text-sm">✓</span>
                </motion.div>
              )}
              
              <div className="text-4xl mb-2">{interest.icon}</div>
              <div className="text-sm font-semibold">{interest.name}</div>
            </motion.button>
          ))}
        </div>

        {/* Selected count */}
        {selectedInterests.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[#F5B82E] mb-6"
          >
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
          </motion.p>
        )}

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-200"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSkip}
            className="w-full text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            Skip
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}