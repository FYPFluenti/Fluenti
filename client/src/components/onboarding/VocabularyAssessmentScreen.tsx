import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

interface VocabularyAssessmentScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const vocabularyOptions = [
  { id: '0-words', label: '0 words', color: 'from-red-400 to-red-500' },
  { id: '1-5-words', label: '1-5 words', color: 'from-orange-400 to-orange-500' },
  { id: '6-10-words', label: '6-10 words', color: 'from-yellow-400 to-yellow-500' },
  { id: '11-50-words', label: '11-50 words', color: 'from-green-400 to-green-500' },
  { id: '50+-words', label: '50+ words', color: 'from-blue-400 to-blue-500' },
  { id: 'cant-tell', label: "Can't tell", color: 'from-gray-400 to-gray-500' },
];

export default function VocabularyAssessmentScreen({ data, onNext, onBack }: VocabularyAssessmentScreenProps) {
  const childName = data.childName || 'your child';
  const [selectedLevel, setSelectedLevel] = useState<string>(data.vocabularyLevel || '');

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
  };

  const handleContinue = () => {
    if (selectedLevel) {
      onNext({ vocabularyLevel: selectedLevel });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <MessageCircle className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
          Approximately how many words can <span className="text-[#F5B82E]">{childName}</span> say?
        </h1>

        {/* Vocabulary Options */}
        <div className="space-y-4 mb-8">
          {vocabularyOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLevelSelect(option.id)}
              className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                selectedLevel === option.id
                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: selectedLevel ? 1.02 : 1 }}
          whileTap={{ scale: selectedLevel ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!selectedLevel}
          className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
            selectedLevel
              ? 'bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white hover:shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}