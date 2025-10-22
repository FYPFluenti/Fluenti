import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-2xl font-normal text-gray-900 mb-2">
          Book a free 15-min evaluation
        </h1>
        
        <p className="text-gray-600 font-semibold mb-3 text-sm sm:text-base">Available for a short time!</p>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
          Speak directly with a speech therapist and discover personalized solutions for your child.
        </p>

        {/* Calendar Widget */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-6 gap-2 mb-6">
            {availableDates.map((dateInfo, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                onClick={() => dateInfo.available && handleDateSelect(dateInfo.date)}
                disabled={!dateInfo.available}
                className={`p-2 sm:p-3 rounded-xl text-center transition-all duration-200 ${
                  dateInfo.available
                    ? selectedDate === dateInfo.date
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-medium mb-1">{dateInfo.day}</div>
                <div className="text-base sm:text-lg font-bold">{dateInfo.date}</div>
              </motion.button>
            ))}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Available Slots — Wed, Oct 15, 2025
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Pakistan Standard Time (GMT+5)
          </div>

          {/* Time Sections */}
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Morning</h4>
              <p className="text-sm text-gray-500">No availability</p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Afternoon</h4>
              <p className="text-sm text-gray-500">No availability</p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Evening</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timeSlots.map((time, index) => (
                  <motion.button
                    key={time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.03 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTime === time
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200'
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
              ? 'bg-black text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue

        </motion.button>
      </motion.div>
    </div>
  );
}
