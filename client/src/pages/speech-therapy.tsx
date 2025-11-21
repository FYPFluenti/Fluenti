import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Clock,
  Volume2,
  VolumeX,
  Play,
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
        const { buildApiUrl } = await import('@/lib/apiUtils');
        const onboardingRes = await fetch(buildApiUrl('/api/onboarding'), {
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
            </div>

            {/* Game Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button 
                onClick={() => setLocation('/story-game')}
                className="bg-gradient-to-r from-[#ff6b1d] to-orange-500 hover:from-[#e55a1a] hover:to-orange-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Story Builder Game</h3>
                  <p className="text-white/90">
                    Create amazing stories while practicing your speech skills!
                  </p>
                </div>
              </button>
              
              <div className="bg-card border border-border rounded-xl p-8 text-center opacity-60">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-2 text-muted-foreground">More Games Coming Soon!</h3>
                <p className="text-muted-foreground">
                  We're working hard to bring you more exciting speech games.
                </p>
              </div>
            </div>
            
            <div className="text-center">
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