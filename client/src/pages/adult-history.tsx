import { useAuth } from "@/hooks/useAuth";
import { useTherapyHistory } from "@/hooks/useTherapyHistory";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Clock, Brain, MessageSquare, AlertCircle, RefreshCw, Loader2, Play, ChevronRight, Mic, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";

interface User {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

export default function AdultHistory() {
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  const [showAdultSettings, setShowAdultSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'voice' | 'chat'>('all');
  
  // Use the therapy history hook to fetch real data - always fetch all sessions for filtering
  const { sessions: allSessions, loading, error, total: totalSessions, hasMore, loadMore, refresh } = useTherapyHistory({
    limit: 50, // Fetch more sessions to ensure we have enough for client-side filtering
    type: 'all' // Always fetch all sessions, filter on frontend
  });

  // Apply client-side filtering based on session mode
  const sessions = selectedFilter === 'all' 
    ? allSessions 
    : allSessions.filter(session => {
        if (selectedFilter === 'voice') {
          return session.mode === 'voice';
        } else if (selectedFilter === 'chat') {
          return session.mode === 'chat' || !session.mode; // Include sessions without mode (default to chat)
        }
        return true;
      });

  // Calculate filtered total
  const total = selectedFilter === 'all' ? totalSessions : sessions.length;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

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

  if (!isAuthenticated) {
    return null;
  }

  // Format session data for display
  const formatSessionForDisplay = (session: any) => {
    const sessionDate = new Date(session.date);
    return {
      ...session,
      time: sessionDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      formattedDate: sessionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const displaySessions = sessions.map(formatSessionForDisplay);

  // Function to continue a therapy session
  const continueSession = (session: any) => {
    const sessionId = session.sessionId || session.id;
    
    // Navigate to appropriate therapy page based on session mode and type with session ID
    if (session.type === 'support' || session.type === 'chat') {
      // Check mode to decide between voice and chat interface
      if (session.mode === 'voice') {
        setLocation(`/emotional-support-voice?sessionId=${sessionId}`);
      } else {
        setLocation(`/emotional-support?sessionId=${sessionId}`); // Default to chat mode
      }
    } else if (session.type === 'therapy') {
      setLocation(`/emotional-support?sessionId=${sessionId}`); // Can be changed to a specific therapy page if needed
    } else {
      // Default to emotional support chat
      setLocation(`/emotional-support?sessionId=${sessionId}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'therapy': return <Brain className="w-5 h-5" />;
      case 'support': return <MessageSquare className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'therapy': return 'bg-purple-100 text-purple-600';
      case 'support': return 'bg-green-100 text-green-600';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="history"
      />

      {/* Main Content */}
      <div className="ml-20 flex-1 flex flex-col">
        <PageHeader />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with Stats */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Session History</h1>
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `${total} total sessions recorded`}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'All Sessions', icon: Calendar },
                { key: 'voice', label: 'Voice Sessions', icon: Mic },
                { key: 'chat', label: 'Chat Sessions', icon: MessageCircle },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key as any)}
                  disabled={loading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedFilter === key
                      ? 'bg-[#ff6b1d] text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* History Timeline */}
            <div className="space-y-4">
              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#ff6b1d] mb-4" />
                  <p className="text-muted-foreground">Loading your session history...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={refresh} variant="outline" className="text-[#ff6b1d] border-[#ff6b1d]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {!loading && !error && displaySessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={() => continueSession(session)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {session.riskLevel && session.riskLevel !== 'low' && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              session.riskLevel === 'high' ? 'bg-[#ff6b1d]/10 text-[#ff6b1d]' : 'bg-[#ff6b1d]/10 text-[#ff6b1d]'
                            }`}>
                              {session.riskLevel} risk
                            </div>
                          )}
                          {session.mode && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-[#ff6b1d]/10 text-[#ff6b1d] flex items-center gap-1">
                              {session.mode === 'voice' ? (
                                <>
                                  <Mic className="w-3 h-3" />
                                  Voice
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="w-3 h-3" />
                                  Chat
                                </>
                              )}
                            </div>
                          )}
                          {session.messages && session.messages.length > 0 && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-[#ff6b1d]/10 text-[#ff6b1d]">
                              {session.messages.length} messages
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-[#ff6b1d] transition-colors">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                continueSession(session);
                              }}
                              className="text-[#ff6b1d] hover:text-[#e55a1a] hover:bg-[#ff6b1d]/10"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Continue
                            </Button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#ff6b1d] transition-colors" />
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {session.notes}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{session.formattedDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Duration: {session.duration}</span>
                          </div>
                          {session.score !== undefined && (
                            <div className="flex items-center space-x-1">
                              <span>Score: {session.score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="text-center mt-6">
                <Button 
                  onClick={loadMore}
                  variant="outline"
                  className="text-[#ff6b1d] border-[#ff6b1d] hover:bg-[#ff6b1d] hover:text-white"
                >
                  Load More Sessions
                </Button>
              </div>
            )}

            {!loading && !error && displaySessions.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {selectedFilter === 'voice' 
                    ? 'No voice sessions found'
                    : selectedFilter === 'chat'
                    ? 'No chat sessions found'
                    : 'No emotional therapy sessions found'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {selectedFilter === 'voice'
                    ? 'Start a voice conversation to see your voice sessions here.'
                    : selectedFilter === 'chat'
                    ? 'Start a chat conversation to see your chat sessions here.'
                    : 'Start your emotional wellness journey to see your progress history here.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />

      {/* Adult Settings Modal */}
      <AdultSettings
        isOpen={showAdultSettings}
        onClose={() => setShowAdultSettings(false)}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}
