import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AssessmentAnalyzer, type AssessmentData, type AssessmentReport } from '@/lib/assessmentAnalyzer';

interface ReportScreenProps {
  data: AssessmentData;
  onStartPracticing: () => void;
  onLearnMore: () => void;
}

export default function ReportScreen({ data, onStartPracticing, onLearnMore }: ReportScreenProps) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate AI-powered assessment report
    const generateReport = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Generating AI-powered assessment report...');
        
        const generatedReport = await AssessmentAnalyzer.generateReport(data);
        setReport(generatedReport);
        
        console.log('Assessment report generated:', {
          aiPowered: generatedReport.aiPowered,
          overallRisk: generatedReport.overallRiskLevel,
          categories: generatedReport.categories.length
        });
      } catch (err) {
        console.error('Error generating assessment report:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate report');
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-8"></div>
          <h1 className="text-2xl font-normal text-foreground mb-4">Analyzing Assessment</h1>
          <p className="text-muted-foreground text-base">Our AI is carefully reviewing your child's responses...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-destructive text-6xl mb-8">⚠️</div>
          <h1 className="text-2xl font-normal text-foreground mb-4">Assessment Error</h1>
          <p className="text-muted-foreground text-base mb-16">{error || 'Failed to generate assessment report'}</p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()} 
            className="w-full bg-primary text-primary-foreground font-medium py-4 px-8 rounded-full hover:bg-primary/90 transition-all duration-200"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Risk level colors and styling
  const getRiskLevelColor = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'high': return 'border-l-4 border-red-400';
      case 'moderate': return 'border-l-4 border-orange-400';
      case 'low': return 'border-l-4 border-green-400';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'high': 
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L22 9L15.5 15L17.18 22L12 18.27L6.82 22L8.5 15L2 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 8V12M12 16H12.01"/>
          </svg>
        );
      case 'moderate': 
        return (
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
          </svg>
        );
      case 'low': 
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
          </svg>
        );
    }
  };

  const getRiskLabel = (riskLevel: 'low' | 'moderate' | 'high', concerningAnswers: number) => {
    switch (riskLevel) {
      case 'high': return `${concerningAnswers} area${concerningAnswers !== 1 ? 's' : ''} need attention`;
      case 'moderate': return `${concerningAnswers} area${concerningAnswers !== 1 ? 's' : ''} to monitor`;
      case 'low': return 'on track!';
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-normal text-foreground">assessment complete</h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            we've analyzed your responses and created a personalized report for {report.childName}
          </p>
          <div className="text-sm text-muted-foreground/80">
            {report.childAge.years} years, {report.childAge.months} months old
          </div>
          {report.aiPowered && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary mt-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L15.5 15L17.18 22L12 18.27L6.82 22L8.5 15L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <span>AI-Powered Analysis</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-foreground">here's what we found</h2>
        <div className="bg-muted rounded-2xl p-6 max-w-lg mx-auto">
          <p className="text-base text-foreground leading-relaxed">
            {report.summary}
          </p>
        </div>
      </motion.div>

      {/* Overall Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-base font-semibold text-foreground">overall assessment</h3>
        <div className="inline-flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
          {getRiskIcon(report.overallRiskLevel)}
          <span className="text-sm font-medium text-foreground">
            {report.overallRiskLevel} risk level
          </span>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <h3 className="text-base font-semibold text-foreground">areas assessed</h3>
        <div className="space-y-3 max-w-lg mx-auto">
          {report.categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="text-left bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                  <div className="flex items-center gap-2 ml-3">
                    {getRiskIcon(category.riskLevel)}
                    <span className="text-xs text-gray-500">
                      {getRiskLabel(category.riskLevel, category.concerningAnswers)}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 leading-normal">{category.description}</p>
                
                {category.recommendations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 mt-3">
                    <p className="text-xs font-medium text-gray-800">
                      recommended activities
                    </p>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      {category.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5 text-xs">•</span>
                          <span className="leading-normal">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 text-right pt-1">
                  {Math.round(category.milestoneAlignment)}% milestone alignment
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
        transition={{ delay: 0.7 }}
        className="space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartPracticing}
          className="w-full bg-primary text-primary-foreground font-medium py-4 px-8 rounded-full hover:bg-primary/90 transition-all duration-200"
        >
          start practicing
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onLearnMore}
          className="w-full text-muted-foreground font-medium py-3 px-6 hover:text-foreground transition-colors"
        >
          learn more
        </motion.button>
      </motion.div>
    </div>
  );
}