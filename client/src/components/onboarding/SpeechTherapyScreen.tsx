import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SpeechTherapyScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function SpeechTherapyScreen({ data, onNext, onBack, onSkip }: SpeechTherapyScreenProps) {
  // Temporarily commented out - skip this question for now
  /*
  const [seekingTherapy, setSeekingTherapy] = useState<boolean | null>(
    data.seekingSpeechTherapy !== undefined ? data.seekingSpeechTherapy : null
  );

  const handleOptionSelect = (value: boolean) => {
    setSeekingTherapy(value);
  };

  const handleContinue = () => {
    if (seekingTherapy !== null) {
      onNext({ seekingSpeechTherapy: seekingTherapy });
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
          Are you currently looking for a speech therapist?
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionSelect(false)}
            className={`flex-1 rounded-3xl p-8 font-bold text-2xl transition-all duration-200 min-h-[120px] flex items-center justify-center ${
              seekingTherapy === false
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            NO
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionSelect(true)}
            className={`flex-1 rounded-3xl p-8 font-bold text-2xl transition-all duration-200 min-h-[120px] flex items-center justify-center ${
              seekingTherapy === true
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            YES
          </motion.button>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: seekingTherapy !== null ? 1.02 : 1 }}
            whileTap={{ scale: seekingTherapy !== null ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={seekingTherapy === null}
            className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
              seekingTherapy !== null
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
  */
  
  // Skip this question for now and proceed to next step
  React.useEffect(() => {
    onNext({ seekingSpeechTherapy: false });
  }, [onNext]);

  // Return null to hide the component completely
  return null;
}
