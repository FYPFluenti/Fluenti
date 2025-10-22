import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EvaluationQuestionScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function EvaluationQuestionScreen({ data, onNext, onBack, onSkip }: EvaluationQuestionScreenProps) {
  const childName = data.childName || 'your child';
  const [hasBeenEvaluated, setHasBeenEvaluated] = useState<boolean | null>(
    data.hasBeenEvaluated !== undefined ? data.hasBeenEvaluated : null
  );

  const handleOptionSelect = (value: boolean) => {
    setHasBeenEvaluated(value);
  };

  const handleContinue = () => {
    if (hasBeenEvaluated !== null) {
      onNext({ hasBeenEvaluated });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-8">
          Has <span className="text-[#F5B82E]">{childName}</span> been evaluated by a speech therapist?
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* NO Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionSelect(false)}
            className={`flex-1 rounded-3xl p-8 font-bold text-2xl transition-all duration-200 min-h-[120px] flex items-center justify-center ${
              hasBeenEvaluated === false
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            NO
          </motion.button>

          {/* YES Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionSelect(true)}
            className={`flex-1 rounded-3xl p-8 font-bold text-2xl transition-all duration-200 min-h-[120px] flex items-center justify-center ${
              hasBeenEvaluated === true
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            YES
          </motion.button>
        </div>

        <div className="space-y-4">
          {/* Continue Button */}
          <motion.button
            whileHover={{ scale: hasBeenEvaluated !== null ? 1.02 : 1 }}
            whileTap={{ scale: hasBeenEvaluated !== null ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={hasBeenEvaluated === null}
            className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
              hasBeenEvaluated !== null
                ? 'bg-black text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue

          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
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
