import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';

interface BirthDateScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function BirthDateScreen({ data, onNext, onBack }: BirthDateScreenProps) {
  const childName = data.childName || 'your child';
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    data.childBirthDate ? new Date(data.childBirthDate) : null
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      onNext({ childBirthDate: selectedDate });
    }
  };

  const generateDateOptions = () => {
    const options = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - 1 - i;
      const month = 9 + i; // Oct, Nov, Dec
      const day = 11 + i;
      const monthIndex = month > 11 ? month - 12 : month;
      const actualYear = month > 11 ? year + 1 : year;
      
      options.push({
        day,
        month: months[monthIndex],
        year: actualYear,
        date: new Date(actualYear, monthIndex, day)
      });
    }
    return options;
  };

  const dateOptions = generateDateOptions();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <Calendar className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          When was <span className="text-[#F5B82E]">{childName}</span> born?
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          We need {childName === 'your child' ? 'your child' : childName}'s birth date in order to ask the right questions according to their age group.
        </p>

        {/* Date Selection Options */}
        <div className="space-y-4 mb-8">
          {dateOptions.map((option, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDate(option.date)}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 ${
                selectedDate && selectedDate.getTime() === option.date.getTime()
                  ? 'border-[#F5B82E] bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex justify-center items-center gap-4">
                <span className="text-2xl font-bold text-[#F5B82E]">{option.day}</span>
                <span className="text-xl font-semibold">{option.month}</span>
                <span className="text-xl font-semibold">{option.year}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Custom Date Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-8"
        >
          <p className="text-sm text-gray-500 mb-4">Or select a custom date:</p>
          <input
            type="date"
            title="Select birth date"
            placeholder="Select birth date"
            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
            min={`${currentYear - 18}-01-01`}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:border-[#F5B82E] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: selectedDate ? 1.02 : 1 }}
          whileTap={{ scale: selectedDate ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!selectedDate}
          className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
            selectedDate
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