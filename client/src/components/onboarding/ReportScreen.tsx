import React from 'react';
import { motion } from 'framer-motion';
import { AssessmentAnalyzer, type AssessmentData } from '@/lib/assessmentAnalyzer';

interface ReportScreenProps {
  data: AssessmentData;
  onStartPracticing: () => void;
  onLearnMore: () => void;
}

export default function ReportScreen({ data, onStartPracticing, onLearnMore }: ReportScreenProps) {
  // Generate real assessment report using the analyzer
  const report = AssessmentAnalyzer.generateReport(data);

  // Risk level colors and styling
  const getRiskLevelColor = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'high': return 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'moderate': return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      case 'low': return 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'high': return <span className="w-4 h-4 inline-block text-center font-bold">!</span>;
      case 'moderate': return <span className="w-4 h-4 inline-block text-center font-bold">~</span>;
      case 'low': return <span className="w-4 h-4 inline-block text-center font-bold">+</span>;
    }
  };

  const getRiskLabel = (riskLevel: 'low' | 'moderate' | 'high', concerningAnswers: number) => {
    switch (riskLevel) {
      case 'high': return `${concerningAnswers} area${concerningAnswers !== 1 ? 's' : ''} need attention`;
      case 'moderate': return `${concerningAnswers} area${concerningAnswers !== 1 ? 's' : ''} to monitor`;
      case 'low': return 'On track!';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Assessment Report
        </h1>
        
        <div className="bg-gradient-to-r from-[#F5B82E] to-orange-400 text-transparent bg-clip-text font-bold text-lg">
          Report for: {report.childName} - {report.childAge.years} years, {report.childAge.months} months
        </div>
      </motion.div>

      {/* Main Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Summary</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {report.summary}
        </p>
        
        {/* Overall Risk Assessment */}
        <div className={`mt-4 p-4 rounded-xl border-l-4 ${getRiskLevelColor(report.overallRiskLevel)}`}>
          <div className="flex items-center gap-2">
            {getRiskIcon(report.overallRiskLevel)}
            <span className="font-semibold">
              Overall Assessment: {report.overallRiskLevel.charAt(0).toUpperCase() + report.overallRiskLevel.slice(1)} Risk
            </span>
          </div>
        </div>
      </motion.div>

      {/* Assessed Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Assessed Categories</h2>
        
        <div className="space-y-4">
          {report.categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`border-l-4 ${getRiskLevelColor(category.riskLevel)} p-4 rounded-r-xl`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-white">{category.name}</h3>
                    <div className="flex items-center gap-1">
                      {getRiskIcon(category.riskLevel)}
                      <span className="text-sm font-semibold">
                        {getRiskLabel(category.riskLevel, category.concerningAnswers)}
                      </span>
                    </div>
                    {/* Milestone alignment percentage */}
                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                      {Math.round(category.milestoneAlignment)}% aligned
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-2">
                    {category.description}
                  </p>
                  
                  {/* Show recommendations if any */}
                  {category.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Recommendations:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {category.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-[#F5B82E] mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps Section */}
      {report.nextSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            Recommended Next Steps
          </h2>
          <ul className="space-y-2">
            {report.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartPracticing}
          className="w-full bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-200"
        >
          Start practicing
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLearnMore}
          className="w-full bg-white dark:bg-gray-700 border-2 border-[#F5B82E] text-[#F5B82E] py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-[#F5B82E] hover:text-white transition-all duration-200"
        >
          Learn more
        </motion.button>
      </motion.div>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
      >
        <button className="hover:text-[#F5B82E] transition-colors duration-200 flex items-center gap-1">
          Privacy & Terms
        </button>
        <button className="hover:text-[#F5B82E] transition-colors duration-200">
          Disclaimer
        </button>
      </motion.div>
    </div>
  );
}