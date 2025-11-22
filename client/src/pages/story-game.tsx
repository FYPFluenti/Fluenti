import React from 'react';
import StoryGameApp from '@/components/games/story-game/StoryGameApp';
import SharedSidebar from '@/components/layout/SharedSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import PageHeader from '@/components/layout/PageHeader';
import FeedbackModal from '@/components/layout/FeedbackModel';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

export default function StoryGamePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#ff6b1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ff6b1d]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedSidebar 
          onFeedbackOpen={() => setShowFeedback(true)}
          currentPage="games"
        />
      </div>

      {/* Main Content - Full screen for game with mobile padding */}
      <main className="lg:ml-20 w-full min-h-screen max-w-full overflow-x-hidden">
        <div className="pb-20 lg:pb-0">
          <StoryGameApp />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="games"
        userType="child"
      />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}

