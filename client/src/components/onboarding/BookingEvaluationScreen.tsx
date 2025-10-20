import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingEvaluationScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const timeSlots = [
  '9:15 PM', '10:15 PM', '10:30 PM', '10:45 PM', '11:15 PM', '11:45 PM'
];

const availableDates = [
  { day: 'Sun', date: 12, available: false },
  { day: 'Mon', date: 13, available: false },
  { day: 'Tue', date: 14, available: false },
  { day: 'Wed', date: 15, available: true },
  { day: 'Thu', date: 16, available: false },
  { day: 'Fri', date: 17, available: false },
];

export default function BookingEvaluationScreen({ data, onNext, onBack }: BookingEvaluationScreenProps) {
  const [selectedDate, setSelectedDate] = useState<number>(
    data.evaluationBooking?.selectedDate ? new Date(data.evaluationBooking.selectedDate).getDate() : 15
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    data.evaluationBooking?.selectedTime || ''
  );

  const handleDateSelect = (date: number) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const selectedDateObj = new Date(2025, 9, selectedDate); // October 2025
      onNext({
        evaluationBooking: {
          selectedDate: selectedDateObj,
          selectedTime,
          timezone: 'Pakistan Standard Time (GMT+5)'
        }
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center"
      >
        <Calendar className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Book a free 15-min evaluation
        </h1>
        
        <p className="text-[#F5B82E] font-semibold mb-4">Available for a short time!</p>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Speak directly with a speech therapist and discover personalized solutions for your child.
        </p>

        {/* Calendar Widget */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-6 gap-2 mb-4">
            {availableDates.map((dateInfo, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={() => dateInfo.available && handleDateSelect(dateInfo.date)}
                disabled={!dateInfo.available}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  dateInfo.available
                    ? selectedDate === dateInfo.date
                      ? 'bg-[#F5B82E] text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-medium">{dateInfo.day}</div>
                <div className="text-lg font-bold">{dateInfo.date}</div>
              </motion.button>
            ))}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Available Slots — Wed, Oct 15, 2025
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Pakistan Standard Time (GMT+5)
          </div>

          {/* Time Sections */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Morning</h4>
              <p className="text-sm text-gray-400">No availability</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Afternoon</h4>
              <p className="text-sm text-gray-400">No availability</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Evening</h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time, index) => (
                  <motion.button
                    key={time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTime === time
                        ? 'bg-[#F5B82E] text-white shadow-lg'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                  >
                    {time}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: selectedDate && selectedTime ? 1.02 : 1 }}
          whileTap={{ scale: selectedDate && selectedTime ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
            selectedDate && selectedTime
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