import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  User, 
  CheckCircle, 
  Clock, 
  Heart,
  Brain,
  Gamepad2,
  Volume2,
  MessageSquare,
  BarChart3,
  Calendar,
  ArrowRight,
  Award
} from 'lucide-react';
import SharedSidebar from '@/components/layout/SharedSidebar';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface UserOnboardingData {
  userId: string;
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
  currentStep?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function OnboardingStatistics() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [onboardingData, setOnboardingData] = useState<UserOnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOnboardingData();
    }
  }, [isAuthenticated]);

  const fetchUserOnboardingData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/onboarding', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Failed to fetch onboarding data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your onboarding data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueOnboarding = () => {
    setLocation('/onboarding');
  };

  const calculateProgress = () => {
    if (!onboardingData) return 0;
    const totalSteps = 21;
    return Math.round(((onboardingData.currentStep || 1) / totalSteps) * 100);
  };

  const getAssessmentCount = (category: keyof NonNullable<UserOnboardingData['assessmentResponses']>) => {
    return onboardingData?.assessmentResponses?.[category]?.length || 0;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your onboarding data...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex child-dashboard-no-zoom">
        <SharedSidebar currentPage="onboarding-stats" />
        
        <main className="ml-20 w-full child-dashboard-container">
          <PageHeader className="flex justify-end items-center gap-4 px-4 sm:px-5 py-4 sm:py-5" />
          
          <div className="px-5 pt-9">
            <div className="mx-auto max-w-4xl text-center py-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">No Onboarding Data</h1>
                <p className="text-muted-foreground mb-6">
                  You haven't started the onboarding process yet.
                </p>
              </div>
              <button
                onClick={handleContinueOnboarding}
                className="inline-flex items-center gap-2 bg-[#F5B82E] text-black px-5 py-2.5 rounded-lg text-[15px] font-semibold hover:opacity-90 transition"
              >
                Start Onboarding <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background text-foreground flex child-dashboard-no-zoom">
      <SharedSidebar currentPage="onboarding-stats" />
      
      <main className="ml-20 w-full child-dashboard-container">
        <PageHeader className="flex justify-end items-center gap-4 px-4 sm:px-5 py-4 sm:py-5" />
        
        <div className="px-5 pt-9">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[26px] font-bold">
                your onboarding progress
              </h1>
              <p className="text-[15px] text-muted-foreground mt-1">
                Track your assessment completion and child's profile
              </p>
            </div>

            {/* Progress Overview */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    {onboardingData.isCompleted ? 'Onboarding Completed! 🎉' : 'Onboarding In Progress'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {onboardingData.isCompleted 
                      ? 'All steps completed successfully'
                      : `Step ${onboardingData.currentStep || 1} of 21`
                    }
                  </p>
                </div>
                {!onboardingData.isCompleted && (
                  <button
                    onClick={handleContinueOnboarding}
                    className="inline-flex items-center gap-2 bg-[#F5B82E] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#F5B82E] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">0%</span>
                  <span className="text-xs font-bold text-[#F5B82E]">{progress}%</span>
                  <span className="text-xs text-muted-foreground">100%</span>
                </div>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">CHILD NAME</span>
                </div>
                <div className="text-xl font-bold truncate">
                  {onboardingData.childName || 'Not set'}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {onboardingData.childGender || 'Not specified'}
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">BIRTH YEAR</span>
                </div>
                <div className="text-xl font-bold">
                  {onboardingData.childBirthYear || 
                   (onboardingData.childBirthDate ? new Date(onboardingData.childBirthDate).getFullYear() : 'Not set')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(onboardingData.childBirthYear || (onboardingData.childBirthDate && new Date(onboardingData.childBirthDate).getFullYear())) 
                    ? `Age ${new Date().getFullYear() - (onboardingData.childBirthYear || new Date(onboardingData.childBirthDate!).getFullYear())}` 
                    : 'Unknown'}
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">VOCABULARY</span>
                </div>
                <div className="text-xl font-bold capitalize">
                  {onboardingData.vocabularyLevel?.replace(/-/g, ' ') || 'Not assessed'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current level
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">THERAPY</span>
                </div>
                <div className="text-xl font-bold">
                  {onboardingData.seekingSpeechTherapy === true ? 'Yes' : onboardingData.seekingSpeechTherapy === false ? 'No' : 'Not set'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Seeking help
                </div>
              </div>
            </div>

            {/* Interests & Assessments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Interests */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  child's interests
                </h3>
                
                {onboardingData.interests && onboardingData.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {onboardingData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#F5B82E]/10 text-[#F5B82E] rounded-lg text-sm font-medium capitalize"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interests selected yet</p>
                )}
              </div>

              {/* Assessment Progress */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  assessment responses
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Hearing</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">
                      {getAssessmentCount('hearing')} {getAssessmentCount('hearing') === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Pragmatics</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">
                      {getAssessmentCount('pragmatics')} {getAssessmentCount('pragmatics') === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Play</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">
                      {getAssessmentCount('play')} {getAssessmentCount('play') === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Comprehension</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">
                      {getAssessmentCount('comprehension')} {getAssessmentCount('comprehension') === 1 ? 'question' : 'questions'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Info */}
            {(onboardingData.createdAt || onboardingData.updatedAt) && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  timeline
                </h3>
                
                <div className="space-y-3">
                  {onboardingData.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Started</span>
                      <span className="text-sm font-medium">
                        {new Date(onboardingData.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  
                  {onboardingData.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">
                        {new Date(onboardingData.updatedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {onboardingData.isCompleted && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg mt-4">
                      <Award className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        Onboarding completed successfully!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
