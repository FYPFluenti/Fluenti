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

const TOTAL_STEPS = 5; // Only basic info: welcome, age, name, gender, birth date

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
      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl('/api/onboarding'), {
        headers: {
          'Content-Type': 'application/json'
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
      // Silently fail if backend is not available
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Failed to load onboarding data:', error);
      }
    }
  };

  const saveOnboardingData = async (data: Partial<OnboardingData>, step: number) => {
    try {
      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl('/api/onboarding'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Cookies are sent automatically
        body: JSON.stringify({ ...data, currentStep: step })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save onboarding data: ${response.status}`);
      }
    } catch (error) {
      // Only log error, don't show toast for network errors (server might be down)
      // This prevents spam errors when backend is not running
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        // Silently fail - backend server is likely not running
        console.warn('Backend server not available, saving locally only');
      } else {
        console.error('Failed to save onboarding data:', error);
        toast({
          title: "Error",
          description: "Failed to save your progress. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleNext = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);
    
    const nextStep = currentStep + 1;
    
    await saveOnboardingData(updatedData, nextStep);
    
    if (nextStep > TOTAL_STEPS) {
      await completeOnboarding(updatedData);
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const previousStep = currentStep - 1;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg"></span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-foreground">All Set!</h2>
          <p className="text-muted-foreground text-lg mb-6">
            Thank you for completing the assessment. We've created a personalized experience for your child.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
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
      // All assessment screens removed - only basic info collection
      default: return <WelcomeScreen {...stepProps} onSkip={handleMaybeLater} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Simple progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
              >
                ←
              </button>
            )}
            <div className="text-sm text-muted-foreground ml-auto">
              {currentStep} / {TOTAL_STEPS}
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <motion.div 
              className="bg-primary h-1 rounded-full"
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