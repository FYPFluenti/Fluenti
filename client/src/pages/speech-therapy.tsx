import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Star,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Crown,
  Zap,
  Target,
  Award,
  Sparkles,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Headphones
} from 'lucide-react';

import SharedSidebar from '@/components/layout/SharedSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';

interface GameSession {
  _id: string;
  gameId: number;
  gameName: string;
  startTime: Date;
  score: number;
  accuracy: number;
  completed: boolean;
}

export default function SpeechTherapyPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth() as { user: { firstName?: string; lastName?: string }; isAuthenticated: boolean };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [childName, setChildName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    stars: 0,
    streak: 0,
    todaysSessions: 0,
    dailyGoal: 3,
    averageAccuracy: 0
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);

        // Fetch child name
        // No need for Authorization header - cookies are sent automatically
        const onboardingRes = await fetch('/api/onboarding', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Handle onboarding data
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json();
          if (onboardingData?.childName) {
            setChildName(onboardingData.childName);
          }
        }

        // Set default user stats since we removed the statistics API
        setUserStats({
          level: 1,
          xp: 0,
          stars: 0,
          streak: 0,
          todaysSessions: 0,
          dailyGoal: 3,
          averageAccuracy: 0
        });

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load game data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, toast]);

  // Today's goal progress
  const dailyProgress = Math.min((userStats.todaysSessions / userStats.dailyGoal) * 100, 100);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center child-dashboard-no-zoom">
        <div className="text-center child-dashboard-container px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to access speech games.</p>
          <button
            onClick={() => setLocation('/login')}
            className="bg-[#ff6b1d] text-white px-6 py-2 rounded-lg hover:bg-[#e55a1a] child-dashboard-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background child-dashboard-no-zoom">
        <SharedSidebar currentPage="games" />
        <main className="ml-20 p-4 sm:p-6 child-dashboard-container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedSidebar 
          onFeedbackOpen={() => setShowFeedback(true)}
          currentPage="games"
        />
      </div>

      {/* Main Content */}
      <main className="lg:ml-20 p-4 lg:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <PageHeader className="flex justify-end items-center mb-4 sm:mb-6 -mt-1 sm:-mt-2" />

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Hi {childName || ((user && 'firstName' in user) ? user.firstName : 'there')}! Ready to practice?
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose a game to improve your speech skills
              </p>
            </div>
          </div>

              {/* Daily Progress */}
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#ff6b1d]" />
                    Today's Goal
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {userStats.todaysSessions}/{userStats.dailyGoal} sessions
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div 
                    className="bg-[#ff6b1d] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {dailyProgress >= 100 ? (
                    <>
                      <span>Daily goal completed!</span>
                      <Award className="w-4 h-4 text-[#ff6b1d]" />
                    </>
                  ) : (
                    `${Math.round(dailyProgress)}% complete`
                  )}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Crown className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.level}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Star className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.stars}</div>
                  <div className="text-xs text-muted-foreground">Stars</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.xp}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Target className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.streak}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </div>

            {/* No Games Available */}
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-muted/50 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Games Coming Soon!</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're working hard to bring you exciting new speech games. Stay tuned for updates!
              </p>
              <button 
                onClick={() => setLocation('/child-dashboard')}
                className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
        </div>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="games"
        userType="child"
      />
    </div>
  );
}