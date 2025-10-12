import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowRight, BookOpen, Play, FileText, Shield } from 'lucide-react';

interface ReportScreenProps {
  data: any;
  onStartPracticing: () => void;
  onLearnMore: () => void;
}

export default function ReportScreen({ data, onStartPracticing, onLearnMore }: ReportScreenProps) {
  // Calculate child's age from birth year
  const calculateAge = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const months = Math.floor(Math.random() * 12); // Random months for demo
    return { years: age, months };
  };

  const age = data.childBirthYear ? calculateAge(data.childBirthYear) : { years: 5, months: 0 };
  const childName = data.childName || 'Child';

  // Analyze assessment responses to generate report
  const analyzeAssessment = () => {
    const issues: Array<{ category: string; issueCount: number; total: number }> = [];
    let totalQuestions = 0;
    let concerningAnswers = 0;

    if (data.assessmentResponses) {
      Object.entries(data.assessmentResponses).forEach(([category, responses]: [string, any]) => {
        if (Array.isArray(responses)) {
          const categoryIssues = responses.filter((r: any) => r.answer === 'no').length;
          totalQuestions += responses.length;
          concerningAnswers += categoryIssues;
          
          if (categoryIssues > 0) {
            issues.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              issueCount: categoryIssues,
              total: responses.length
            });
          }
        }
      });
    }

    return { issues, totalQuestions, concerningAnswers };
  };

  const assessment = analyzeAssessment();

  const categories = [
    {
      name: 'HEARING',
      icon: '👂',
      description: "Children's brains need aural stimulation from day one to learn to distinguish sounds and develop language skills.",
      issues: assessment.issues.find(i => i.category === 'Hearing')?.issueCount || 0
    },
    {
      name: 'PRAGMATICS',
      icon: '💬',
      description: "Social communication skills that help children understand context, take turns in conversation, and use language appropriately.",
      issues: assessment.issues.find(i => i.category === 'Pragmatics')?.issueCount || 0
    },
    {
      name: 'PLAY',
      icon: '🎮',
      description: "Play is essential to child development because it contributes to cognitive, physical, social, and emotional well-being.",
      issues: assessment.issues.find(i => i.category === 'Play')?.issueCount || 0
    },
    {
      name: 'COMPREHENSION',
      icon: '🧠',
      description: "Understanding and processing language, following instructions, and making sense of spoken information.",
      issues: assessment.issues.find(i => i.category === 'Comprehension')?.issueCount || 0
    },
    {
      name: 'TALKING',
      icon: '🗣️',
      description: "As kids gain mastery of language skills they develop conversational abilities and expressive communication.",
      issues: 0 // Default to no issues for talking
    }
  ];

  const totalIssues = categories.reduce((sum, cat) => sum + cat.issues, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <FileText className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Assessment Report
        </h1>
        
        <div className="bg-gradient-to-r from-[#F5B82E] to-orange-400 text-transparent bg-clip-text font-bold text-lg">
          Report for: {childName} - {age.years} years, {age.months} months
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
          We compared your answers with milestones for typical kids older than {age.years * 12 + age.months} months 
          and noticed that {childName} has {totalIssues} potential 
          {totalIssues === 1 ? ' issue' : ' issues'} 
          {assessment.issues.length > 0 && ' with ' + assessment.issues.map(i => i.category).join(' and ')}.
        </p>
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
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`border-l-4 ${
                category.issues > 0 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-green-400 bg-green-50 dark:bg-green-900/20'
              } p-4 rounded-r-xl`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-white">{category.name}</h3>
                    {category.issues > 0 ? (
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {category.issues} potential issue{category.issues !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Looking good!</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {category.issues > 0 
                      ? `${childName} has ${category.issues} potential issue${category.issues !== 1 ? 's' : ''} with ${category.name}. ${category.description}`
                      : category.description
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

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
          <Play className="w-5 h-5" />
          Start practicing
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLearnMore}
          className="w-full bg-white dark:bg-gray-700 border-2 border-[#F5B82E] text-[#F5B82E] py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-[#F5B82E] hover:text-white transition-all duration-200"
        >
          <BookOpen className="w-5 h-5" />
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
          <Shield className="w-4 h-4" />
          Privacy & Terms
        </button>
        <button className="hover:text-[#F5B82E] transition-colors duration-200">
          Disclaimer
        </button>
      </motion.div>
    </div>
  );
}