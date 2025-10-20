import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ArrowRight } from 'lucide-react';

interface PragmaticsAssessmentScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  step: number;
}

const pragmaticsQuestions = [
  "Does {name} speak in different ways depending on the listener and place (one way with friends, and another with adults)?",
  "Is {name} good at sharing information and taking turns with other children?",
  "Has {name} begun using language for fantasy, jokes, and teasing?",
  "Does {name} look at people who are speaking or things being spoken about?"
];

export default function PragmaticsAssessmentScreen({ data, onNext, onBack, step }: PragmaticsAssessmentScreenProps) {
  const childName = data.childName || 'your child';
  const pronoun = data.childGender === 'girl' ? 'her' : data.childGender === 'boy' ? 'him' : 'them';
  const possessivePronoun = data.childGender === 'girl' ? 'she' : data.childGender === 'boy' ? 'he' : 'they';
  
  const question = pragmaticsQuestions[step - 1].replace('{name}', childName);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Get existing pragmatics responses
  const existingResponse = data.assessmentResponses?.pragmatics?.find(
    (response: any) => response.question === question
  );

  React.useEffect(() => {
    if (existingResponse) {
      setSelectedAnswer(existingResponse.answer);
    }
  }, [existingResponse]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleContinue = () => {
    if (selectedAnswer) {
      const updatedPragmaticsResponses = data.assessmentResponses?.pragmatics?.filter(
        (response: any) => response.question !== question
      ) || [];
      
      updatedPragmaticsResponses.push({ question, answer: selectedAnswer });
      
      onNext({
        assessmentResponses: {
          ...data.assessmentResponses,
          pragmatics: updatedPragmaticsResponses
        }
      });
    }
  };

  const getProgressTabs = () => {
    const tabs = ['Hearing', 'Pragmatics', 'Play', 'Communication'];
    return tabs.map((tab, index) => (
      <div
        key={tab}
        className={`px-3 py-2 text-xs font-medium rounded-full ${
          tab === 'Pragmatics' 
            ? 'bg-[#F5B82E] text-white'
            : 'text-gray-500'
        }`}
      >
        {tab}
      </div>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      {/* Progress tabs */}
      <div className="flex justify-center mb-2">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1 gap-1">
          {getProgressTabs()}
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-6">{step} of 4</div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <ThumbsUp className="w-12 h-12 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-8 leading-tight">
          {question}
        </h1>

        <div className="space-y-4 mb-8">
          {/* NO Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswerSelect('no')}
            className={`w-full p-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
              selectedAnswer === 'no'
                ? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            NO
          </motion.button>

          {/* YES Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswerSelect('yes')}
            className={`w-full p-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
              selectedAnswer === 'yes'
                ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            YES
          </motion.button>

          {/* Can't Tell Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswerSelect('cant-tell')}
            className={`w-full p-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
              selectedAnswer === 'cant-tell'
                ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Can't tell
          </motion.button>
        </div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: selectedAnswer ? 1.02 : 1 }}
          whileTap={{ scale: selectedAnswer ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!selectedAnswer}
          className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
            selectedAnswer
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