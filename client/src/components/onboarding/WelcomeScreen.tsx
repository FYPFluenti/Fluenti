import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onNext: (data: any) => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-8">
          welcome to fluenti
        </h1>

        <div className="text-gray-600 text-base leading-relaxed mb-16 space-y-4">
          <p>
            We have some questions to learn about your interests and help make this app special just for you.
          </p>
          <p className="text-sm text-gray-500">
            Takes about 5 minutes
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNext({})}
            className="w-full bg-gray-800 text-white font-medium py-4 px-8 rounded-full hover:bg-gray-700 transition-all duration-200"
          >
            let's start
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSkip}
            className="w-full text-gray-500 font-medium py-3 px-6 hover:text-gray-700 transition-colors"
          >
            maybe later
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}