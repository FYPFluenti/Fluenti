import React from 'react';
import { FoxIcon, SpeechBubbleIcon, UsersIcon, FluencyIcon, DldIcon } from './icons';

interface TherapySelectionScreenProps {
  onSelect: (group: 'pronunciation' | 'fluency' | 'dld' | 'social') => void;
  completedAssessments?: {
    pronunciation?: { level: number; title?: string; feedback?: string; completedAt?: string };
    fluency?: { level: number; title?: string; feedback?: string; completedAt?: string };
    dld?: { level: number; title?: string; feedback?: string; completedAt?: string };
    social?: { level: number; title?: string; feedback?: string; completedAt?: string };
  };
  currentLevels?: {
    pronunciation?: number;
    fluency?: number;
    dld?: number;
    social?: number;
  };
}

const TherapySelectionScreen: React.FC<TherapySelectionScreenProps> = ({ onSelect, completedAssessments = {}, currentLevels = {} }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-white border border-orange-200 rounded-xl shadow-lg p-6 md:p-10">
        <FoxIcon className="w-20 h-20 mx-auto text-[#ff6b1d] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Choose Your Focus</h1>
        <p className="text-gray-600 text-center mb-8 text-lg">What would you like to practice in our adventure today?</p>
        
        <div className="space-y-4">
          <button
            onClick={() => onSelect('pronunciation')}
            className="w-full p-4 rounded-xl border-2 border-orange-200 bg-white hover:border-[#ff6b1d] hover:bg-orange-50 hover:shadow-lg transition-all duration-200 flex items-center space-x-4 text-left relative group"
          >
            {completedAssessments.pronunciation && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex-shrink-0 w-16 h-16 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center transition-colors duration-200">
                <SpeechBubbleIcon className="w-10 h-10 text-[#ff6b1d]" />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#ff6b1d] transition-colors duration-200">Pronunciation Practice</h2>
                <p className="text-gray-600 mt-1 text-sm">Practice making tricky sounds clear and easy to understand.</p>
                {completedAssessments.pronunciation && (
                  <p className="text-xs text-green-600 font-medium mt-1">Level {currentLevels.pronunciation || completedAssessments.pronunciation.level} • Completed</p>
                )}
            </div>
          </button>
          
          <button
            onClick={() => onSelect('fluency')}
            className="w-full p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all duration-200 flex items-center space-x-4 text-left relative group"
          >
            {completedAssessments.fluency && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex-shrink-0 w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors duration-200">
                <FluencyIcon className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">Fluency & Stuttering Practice</h2>
                <p className="text-gray-600 mt-1 text-sm">Practice speaking smoothly and with confidence.</p>
                {completedAssessments.fluency && (
                  <p className="text-xs text-green-600 font-medium mt-1">Level {currentLevels.fluency || completedAssessments.fluency.level} • Completed</p>
                )}
            </div>
          </button>

          <button
            onClick={() => onSelect('dld')}
            className="w-full p-4 rounded-xl border-2 border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 flex items-center space-x-4 text-left relative group"
          >
            {completedAssessments.dld && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex-shrink-0 w-16 h-16 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors duration-200">
                <DldIcon className="w-10 h-10 text-purple-600" />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-200">Language Building Practice</h2>
                <p className="text-gray-600 mt-1 text-sm">Practice building bigger sentences and telling detailed stories.</p>
                {completedAssessments.dld && (
                  <p className="text-xs text-green-600 font-medium mt-1">Level {currentLevels.dld || completedAssessments.dld.level} • Completed</p>
                )}
            </div>
          </button>
          
          <div className="pt-4">
            <button
                onClick={() => onSelect('social')}
                className="w-full p-4 rounded-xl border-2 border-yellow-200 bg-white hover:border-[#F5B82E] hover:bg-yellow-50 hover:shadow-lg transition-all duration-200 flex items-center space-x-4 text-left relative group"
            >
                {completedAssessments.social && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex-shrink-0 w-16 h-16 bg-yellow-100 group-hover:bg-yellow-200 rounded-full flex items-center justify-center transition-colors duration-200">
                    <UsersIcon className="w-10 h-10 text-[#F5B82E]" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#F5B82E] transition-colors duration-200">Social Communication Practice</h2>
                    <p className="text-gray-600 mt-1 text-sm">Practice understanding feelings, taking turns, and making friends.</p>
                    {completedAssessments.social && (
                      <p className="text-xs text-green-600 font-medium mt-1">Level {currentLevels.social || completedAssessments.social.level} • Completed</p>
                    )}
                </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapySelectionScreen;