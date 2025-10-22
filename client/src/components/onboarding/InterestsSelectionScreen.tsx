import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InterestsSelectionScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

const interestOptions = [
  { id: 'animals', name: 'Animals', color: 'from-emerald-400 to-emerald-600' },
  { id: 'nature', name: 'Nature', color: 'from-blue-400 to-blue-600' },
  { id: 'vehicles', name: 'Vehicles', color: 'from-amber-400 to-amber-600' },
  { id: 'books', name: 'Books', color: 'from-purple-400 to-purple-600' },
  { id: 'dinosaurs', name: 'Dinosaurs', color: 'from-lime-400 to-lime-600' },
  { id: 'music', name: 'Music', color: 'from-pink-400 to-pink-600' },
  { id: 'space', name: 'Space', color: 'from-indigo-400 to-indigo-600' },
  { id: 'robots', name: 'Robots', color: 'from-cyan-400 to-cyan-600' },
  { id: 'colors', name: 'Colors', color: 'from-rose-400 to-rose-600' },
  { id: 'numbers', name: 'Numbers', color: 'from-violet-400 to-violet-600' },
  { id: 'shapes', name: 'Shapes', color: 'from-sky-400 to-sky-600' },
  { id: 'food', name: 'Food', color: 'from-orange-400 to-orange-600' },
  { id: 'jobs', name: 'Jobs', color: 'from-red-400 to-red-600' },
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-4">
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
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.6 + index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{ 
                scale: 1.08, 
                rotate: selectedInterests.includes(interest.id) ? 5 : 0,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              whileTap={{ scale: 0.92, rotate: -5 }}
              onClick={() => handleInterestToggle(interest.id)}
              className={`relative p-6 rounded-2xl transition-all duration-200 ${
                selectedInterests.includes(interest.id)
                  ? `bg-black text-white shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="block mb-2">
                {interest.id === 'animals' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#34D399"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🐻</text></svg>
                )}
                {interest.id === 'nature' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#3B82F6"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🌳</text></svg>
                )}
                {interest.id === 'vehicles' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#F59E42"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🚗</text></svg>
                )}
                {interest.id === 'books' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#A78BFA"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">📚</text></svg>
                )}
                {interest.id === 'dinosaurs' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#A3E635"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🦖</text></svg>
                )}
                {interest.id === 'music' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#EC4899"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🎵</text></svg>
                )}
                {interest.id === 'space' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#6366F1"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🌌</text></svg>
                )}
                {interest.id === 'robots' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#06B6D4"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🤖</text></svg>
                )}
                {interest.id === 'colors' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#F43F5E"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🎨</text></svg>
                )}
                {interest.id === 'numbers' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#8B5CF6"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🔢</text></svg>
                )}
                {interest.id === 'shapes' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0EA5E9"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🔺</text></svg>
                )}
                {interest.id === 'food' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#FB923C"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">🍎</text></svg>
                )}
                {interest.id === 'jobs' && (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#EF4444"/><text x="16" y="21" textAnchor="middle" fontSize="18" fill="#fff">👩‍🔧</text></svg>
                )}
              </span>
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
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-200"
          >
            Continue
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