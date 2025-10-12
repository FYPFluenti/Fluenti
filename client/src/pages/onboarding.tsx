import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Calendar, Clock, Users, Heart, Brain, Gamepad2 } from 'lucide-react';
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
  BookingEvaluationScreen,
  EvaluationQuestionScreen,
  HearingAssessmentScreen,
  PragmaticsAssessmentScreen,
  PlayAssessmentScreen,
  ReportScreen,
} from '@/components/onboarding';

interface OnboardingData {
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

const TOTAL_STEPS = 21; // Added ReportScreen

export default function OnboardingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    interests: [],
    assessmentResponses: {
      hearing: [],
      pragmatics: [],
      play: [],
      comprehension: []
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Load existing onboarding data if any
  useEffect(() => {
    const typedUser = user as User;
    if (isAuthenticated && typedUser?.id) {
      loadOnboardingData();
    }
  }, [isAuthenticated, user]);

  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/onboarding', {
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
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, currentStep: step })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
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
    
    const nextStep = currentStep + 1;
    await saveOnboardingData(updatedData, nextStep);
    
    if (nextStep > TOTAL_STEPS) {
      // Complete onboarding
      await completeOnboarding(updatedData);
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      saveOnboardingData(onboardingData, currentStep - 1);
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

  // Handle "Maybe later" from welcome screen - redirect to child dashboard
  const handleMaybeLater = () => {
    toast({
      title: "No worries!",
      description: "You can complete the assessment anytime from your dashboard.",
    });
    setLocation('/child-dashboard');
  };

  // Handle "Start practicing" from report screen - redirect to child dashboard  
  const handleStartPracticing = async () => {
    await completeOnboarding(onboardingData);
  };

  // Handle "Learn more" from report screen
  const handleLearnMore = () => {
    // For now, show a toast. Later can redirect to educational content
    toast({
      title: "Learn More",
      description: "Educational resources will be available soon!",
    });
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    try {
      await saveOnboardingData({ ...finalData, isCompleted: true }, TOTAL_STEPS + 1);
      toast({
        title: "Welcome!",
        description: "Your setup is complete. Let's start your child's learning journey!",
      });
      setLocation('/home');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const getProgressPercentage = () => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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
      case 9: return <BookingEvaluationScreen {...stepProps} />;
      case 10: return <EvaluationQuestionScreen {...stepProps} />;
      case 11: return <HearingAssessmentScreen {...stepProps} />;
      case 12: return <PragmaticsAssessmentScreen {...stepProps} step={1} />;
      case 13: return <PragmaticsAssessmentScreen {...stepProps} step={2} />;
      case 14: return <PragmaticsAssessmentScreen {...stepProps} step={3} />;
      case 15: return <PragmaticsAssessmentScreen {...stepProps} step={4} />;
      case 16: return <PlayAssessmentScreen {...stepProps} step={1} />;
      case 17: return <PlayAssessmentScreen {...stepProps} step={2} />;
      case 18: return <PlayAssessmentScreen {...stepProps} step={3} />;
      case 19: return <PlayAssessmentScreen {...stepProps} step={4} />;
      case 20: return <PlayAssessmentScreen {...stepProps} step={5} />;
      case 21: return <ReportScreen 
                        data={onboardingData} 
                        onStartPracticing={handleStartPracticing}
                        onLearnMore={handleLearnMore}
                      />;
      default: return <WelcomeScreen {...stepProps} onSkip={handleMaybeLater} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
            </div>
            <div className="text-sm font-medium text-[#F5B82E]">
              {getProgressPercentage()}%
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#F5B82E] to-orange-400 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}