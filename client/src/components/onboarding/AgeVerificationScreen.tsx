import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Delete, ArrowRight } from 'lucide-react';

interface AgeVerificationScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function AgeVerificationScreen({ data, onNext, onBack }: AgeVerificationScreenProps) {
  const [birthYear, setBirthYear] = useState<string>(data.childBirthYear?.toString() || '');

  const handleNumberPress = (num: string) => {
    if (birthYear.length < 4) {
      setBirthYear(birthYear + num);
    }
  };

  const handleDelete = () => {
    setBirthYear(birthYear.slice(0, -1));
  };

  const handleContinue = () => {
    if (birthYear.length === 4) {
      const year = parseInt(birthYear);
      const currentYear = new Date().getFullYear();
      
      // Children ages 3-17 (born between currentYear-17 and currentYear-3)
      if (year >= currentYear - 17 && year <= currentYear - 3) {
        onNext({ childBirthYear: year });
      }
    }
  };

  const isValidYear = birthYear.length === 4;
  const year = parseInt(birthYear);
  const currentYear = new Date().getFullYear();
  const isValidAge = year >= currentYear - 17 && year <= currentYear - 3; // Ages 3-17

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <Shield className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          What year were you born? 🎂
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          This helps us make sure the activities are just right for you!
        </p>

        {/* Year Input Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="w-16 h-16 border-2 border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center text-2xl font-bold bg-gray-50 dark:bg-gray-700"
            >
              {birthYear[index] || ''}
            </motion.div>
          ))}
        </div>

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNumberPress(num.toString())}
              className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {num}
            </motion.button>
          ))}
          
          <div></div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberPress('0')}
            className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            0
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <Delete className="w-6 h-6 text-red-500" />
          </motion.button>
        </div>

        {/* Validation Message */}
        {isValidYear && !isValidAge && (
          <p className="text-red-500 text-sm mb-4">
            Please enter a valid birth year. You should be between 3 and 17 years old.
          </p>
        )}

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: isValidYear && isValidAge ? 1.02 : 1 }}
          whileTap={{ scale: isValidYear && isValidAge ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!isValidYear || !isValidAge}
          className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
            isValidYear && isValidAge
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