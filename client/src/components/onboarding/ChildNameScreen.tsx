import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';

interface ChildNameScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function ChildNameScreen({ data, onNext, onBack, onSkip }: ChildNameScreenProps) {
  const [childName, setChildName] = useState<string>(data.childName || '');

  const handleContinue = () => {
    if (childName.trim()) {
      onNext({ childName: childName.trim() });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <User className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Enter your child's name
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Or a nickname. This will help us personalize your app experience.<br />
          <span className="text-sm text-gray-500">(This step is optional)</span>
        </p>

        {/* Name Input */}
        <div className="mb-8">
          <motion.input
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            type="text"
            placeholder="Your child's name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-[#F5B82E] focus:outline-none transition-colors text-center"
            maxLength={50}
          />
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: childName.trim() ? 1.02 : 1 }}
            whileTap={{ scale: childName.trim() ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={!childName.trim()}
            className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
              childName.trim()
                ? 'bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white hover:shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
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