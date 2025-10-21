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
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-16">
          is {childName} a girl or a boy?
        </h1>

        <div className="flex flex-col gap-4 mb-16">
          {/* Girl Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleGenderSelect('girl')}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-full py-4 px-8 transition-all duration-200 border border-gray-200 hover:border-gray-300"
          >
            girl
          </motion.button>

          {/* Boy Option */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleGenderSelect('boy')}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-full py-4 px-8 transition-all duration-200 border border-gray-200 hover:border-gray-300"
          >
            boy
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSkip}
          className="w-full text-gray-500 font-medium py-3 px-6 hover:text-gray-700 transition-colors"
        >
          skip
        </motion.button>
      </motion.div>
    </div>
  );
}