import React from 'react';
import { motion } from 'framer-motion';

interface GenderSelectionScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function GenderSelectionScreen({ data, onNext, onBack, onSkip }: GenderSelectionScreenProps) {
  const childName = data.childName || 'your child';

  const handleGenderSelect = (gender: 'girl' | 'boy') => {
    onNext({ childGender: gender });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
          Is <span className="text-[#F5B82E]">{childName}</span> a girl or a boy?
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Girl Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGenderSelect('girl')}
            className="flex-1 bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-3xl p-8 hover:shadow-lg transition-all duration-200 min-h-[140px] flex items-center justify-center"
          >
            <div>
              <div className="text-6xl mb-3">👧</div>
              <div className="text-xl font-bold">GIRL</div>
            </div>
          </motion.button>

          {/* Boy Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGenderSelect('boy')}
            className="flex-1 bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-3xl p-8 hover:shadow-lg transition-all duration-200 min-h-[140px] flex items-center justify-center"
          >
            <div>
              <div className="text-6xl mb-3">👦</div>
              <div className="text-xl font-bold">BOY</div>
            </div>
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSkip}
          className="w-full text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          Skip
        </motion.button>
      </motion.div>
    </div>
  );
}