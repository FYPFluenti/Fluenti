import React from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Clock } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: (data: any) => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-gradient-to-br from-[#F5B82E] to-orange-400 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <Gift className="w-12 h-12 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-gradient-to-r from-[#F5B82E] to-orange-400 text-transparent bg-clip-text font-bold text-lg mb-2">
          Let's Start Your Journey
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Welcome to Fluenti! 🎉
        </h1>

        <div className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-8 space-y-4">
          <p>
            Hi there! We're so excited to meet you! We have some fun questions 
            to learn about your interests and help make this app super special just for you.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#F5B82E] font-semibold">
            <Clock className="w-5 h-5" />
            <span>Only takes about 5 minutes - it's like a fun game!</span>
          </div>
          <p className="text-sm">
            At the end, you'll get a <strong className="text-[#F5B82E]">special reward</strong> 
            and we'll help you start your speaking adventure!
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNext({})}
            className="w-full bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-200"
          >
            OK, let's do it!
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSkip}
            className="w-full text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            Maybe later
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}