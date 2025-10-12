import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';

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
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-32 h-32 mx-auto mb-6"
      >
        {/* Illustration of therapist with child */}
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center">
          <div className="text-6xl">👨‍⚕️👧</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
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
                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                ? 'bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white hover:shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
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