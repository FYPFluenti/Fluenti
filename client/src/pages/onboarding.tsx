import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/auth';

// Import onboarding step components
import {
  WelcomeScreen,
  AgeVerificationScreen,
  ChildNameScreen,
  GenderSelectionScreen,
  BirthDateScreen,
  InterestsSelectionScreen,
  VocabularyAssessmentScreen,
  SpeechTherapyScreen,
  EvaluationQuestionScreen,
  HearingAssessmentScreen,
  PragmaticsAssessmentScreen,
  PlayAssessmentScreen,
  ReportScreen,
} from '@/components/onboarding';

interface OnboardingData {
  parentBirthYear?: number;
  childBirthYear?: number;
  childName?: string;
  childGender?: 'girl' | 'boy';
  childBirthDate?: Date;
  interests?: string[];
  vocabularyLevel?: string;
  seekingSpeechTherapy?: boolean;
  hasBeenEvaluated?: boolean;
  evaluationBooking?: {
    selectedDate?: Date;
    selectedTime?: string;
    timezone?: string;
  };
  assessmentResponses?: {
    hearing?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    pragmatics?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    play?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    comprehension?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
  };
  isCompleted?: boolean;
}

const TOTAL_STEPS = 20;

export default function OnboardingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    interests: [],
    assessmentResponses: {
      hearing: [],
      pragmatics: [],
      play: [],
      comprehension: []
    }
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    const typedUser = user as User;
    if (isAuthenticated && typedUser?.id) {
      loadOnboardingData();
    }
  }, [isAuthenticated, user]);

  const loadOnboardingData = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch('/api/onboarding', {
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setOnboardingData(data);
          setCurrentStep(data.currentStep || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  const saveOnboardingData = async (data: Partial<OnboardingData>, step: number) => {
    try {
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        credentials: 'include',
        body: JSON.stringify({ ...data, currentStep: step })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save onboarding data: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNext = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);
    
    let nextStep = currentStep + 1;
    
    if (currentStep === 8 && updatedData.seekingSpeechTherapy === false) {
      nextStep = 9;
    }
    
    await saveOnboardingData(updatedData, nextStep);
    
    if (nextStep > TOTAL_STEPS) {
      await completeOnboarding(updatedData);
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      let previousStep = currentStep - 1;
      
      if (currentStep === 9 && onboardingData.seekingSpeechTherapy === false) {
        previousStep = 8;
      }
      
      setCurrentStep(previousStep);
      saveOnboardingData(onboardingData, previousStep);
    }
  };

  const handleSkip = () => {
    const nextStep = currentStep + 1;
    if (nextStep > TOTAL_STEPS) {
      completeOnboarding(onboardingData);
    } else {
      setCurrentStep(nextStep);
      saveOnboardingData(onboardingData, nextStep);
    }
  };

  const handleMaybeLater = () => {
    toast({
      title: "No worries!",
      description: "You can complete the assessment anytime from your dashboard.",
    });
    setLocation('/child-dashboard');
  };

  const handleStartPracticing = async () => {
    await completeOnboarding(onboardingData);
  };

  const handleLearnMore = () => {
    toast({
      title: "Learn More",
      description: "Educational resources will be available soon!",
    });
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    try {
      await saveOnboardingData({ ...finalData, isCompleted: true }, TOTAL_STEPS + 1);
      setIsCompleted(true);
      
      setTimeout(() => {
        toast({
          title: "Welcome to Fluenti!",
          description: "Your personalized learning journey starts now.",
        });
        setLocation('/child-dashboard');
      }, 2500);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const getProgressPercentage = () => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg"></span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">All Set!</h2>
          <p className="text-gray-600 text-lg mb-6">
            Thank you for completing the assessment. We've created a personalized experience for your child.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
            <span>Taking you to your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    const stepProps = {
      data: onboardingData,
      onNext: handleNext,
      onBack: handleBack,
      onSkip: handleSkip,
    };

    switch (currentStep) {
      case 1: return <WelcomeScreen {...stepProps} onSkip={handleMaybeLater} />;
      case 2: return <AgeVerificationScreen {...stepProps} />;
      case 3: return <ChildNameScreen {...stepProps} />;
      case 4: return <GenderSelectionScreen {...stepProps} />;
      case 5: return <BirthDateScreen {...stepProps} />;
      case 6: return <InterestsSelectionScreen {...stepProps} />;
      case 7: return <VocabularyAssessmentScreen {...stepProps} />;
      case 8: return <SpeechTherapyScreen {...stepProps} />;
      case 9: return <EvaluationQuestionScreen {...stepProps} />;
      case 10: return <HearingAssessmentScreen {...stepProps} />;
      case 11: return <PragmaticsAssessmentScreen {...stepProps} step={1} />;
      case 12: return <PragmaticsAssessmentScreen {...stepProps} step={2} />;
      case 13: return <PragmaticsAssessmentScreen {...stepProps} step={3} />;
      case 14: return <PragmaticsAssessmentScreen {...stepProps} step={4} />;
      case 15: return <PlayAssessmentScreen {...stepProps} step={1} />;
      case 16: return <PlayAssessmentScreen {...stepProps} step={2} />;
      case 17: return <PlayAssessmentScreen {...stepProps} step={3} />;
      case 18: return <PlayAssessmentScreen {...stepProps} step={4} />;
      case 19: return <PlayAssessmentScreen {...stepProps} step={5} />;
      case 20: return <ReportScreen 
                        data={onboardingData} 
                        onStartPracticing={handleStartPracticing}
                        onLearnMore={handleLearnMore}
                      />;
      default: return <WelcomeScreen {...stepProps} onSkip={handleMaybeLater} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Simple progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Go back"
              >
                ←
              </button>
            )}
            <div className="text-sm text-gray-500 ml-auto">
              {currentStep} / {TOTAL_STEPS}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div 
              className="bg-gray-800 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Main content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </div>
    </div>
  );
}