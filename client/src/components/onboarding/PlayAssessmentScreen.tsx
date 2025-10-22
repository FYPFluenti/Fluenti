import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PlayAssessmentScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  step: number;
}

const playQuestions = [
  "Can {name} plan construction and make-believe play with other children, for example building a Lego model?",
  "Does {name} enjoy imaginative play with other children, such as dress up, house, doctor, etc.?",
  "Can {name} independently play games with simple rules?",
  "Does {name} enjoy playing games, but might change the rules as {pronoun} goes along?",
  "Is {name} interested in other children's games to the point where {pronoun} actively wants to join them?"
];

export default function PlayAssessmentScreen({ data, onNext, onBack, step }: PlayAssessmentScreenProps) {
  const childName = data.childName || 'your child';
  const pronoun = data.childGender === 'girl' ? 'she' : data.childGender === 'boy' ? 'he' : 'they';
  
  const question = playQuestions[step - 1]
    .replace('{name}', childName)
    .replace('{pronoun}', pronoun);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Get existing play responses
  const existingResponse = data.assessmentResponses?.play?.find(
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
      const updatedPlayResponses = data.assessmentResponses?.play?.filter(
        (response: any) => response.question !== question
      ) || [];
      
      updatedPlayResponses.push({ question, answer: selectedAnswer });
      
      onNext({
        assessmentResponses: {
          ...data.assessmentResponses,
          play: updatedPlayResponses
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 text-center max-w-2xl mx-auto">
      <div className="text-xs text-gray-500 mb-4">{step} of 5</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-8 leading-tight">
          {question}
        </h1>

        <div className="space-y-3 mb-6">
          {/* NO Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswerSelect('no')}
            className={`w-full p-3 rounded-xl font-semibold text-base transition-all duration-200 ${
              selectedAnswer === 'no'
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
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
            className={`w-full p-3 rounded-xl font-semibold text-base transition-all duration-200 ${
              selectedAnswer === 'yes'
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
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
            className={`w-full p-3 rounded-xl font-semibold text-base transition-all duration-200 ${
              selectedAnswer === 'cant-tell'
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
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
              ? 'bg-black text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {step === 5 ? 'Complete Assessment' : 'Continue'}

        </motion.button>
      </motion.div>
    </div>
  );
}
