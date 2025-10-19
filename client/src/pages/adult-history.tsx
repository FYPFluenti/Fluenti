import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Clock, Brain, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import { Card, CardContent } from "@/components/ui/card";
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'therapy' | 'support'>('all');

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

  const historyData = [
    {
      id: 1,
      type: 'therapy',
      title: 'Stress Management Session',
      date: '2025-08-17',
      time: '14:30',
      duration: '45 min',
      mood: 'anxious → calm',
      notes: 'Explored work-related stress and coping strategies. Practiced mindfulness techniques.'
    },
    {
      id: 2,
      type: 'support',
      title: 'Emotional Support Chat',
      date: '2025-08-16',
      time: '10:15',
      duration: '20 min',
      mood: 'sad → hopeful',
      notes: 'Discussed relationship concerns and communication strategies'
    },
    {
      id: 3,
      type: 'therapy',
      title: 'Anxiety Management',
      date: '2025-08-15',
      time: '16:45',
      duration: '30 min',
      mood: 'worried → relaxed',
      notes: 'Learned breathing exercises and cognitive reframing techniques'
    },
    {
      id: 4,
      type: 'support',
      title: 'Daily Check-in',
      date: '2025-08-14',
      time: '11:20',
      duration: '15 min',
      mood: 'neutral → positive',
      notes: 'Reflected on daily achievements and gratitude practice'
    },
    {
      id: 5,
      type: 'therapy',
      title: 'Self-Confidence Building',
      date: '2025-08-13',
      time: '09:30',
      duration: '35 min',
      mood: 'insecure → confident',
      notes: 'Worked on positive self-talk and identifying personal strengths'
    },
  ];

  const getFilteredHistory = () => {
    if (selectedFilter === 'all') return historyData;
    return historyData.filter(item => item.type === selectedFilter || 
      (selectedFilter === 'therapy' && item.type === 'therapy') ||
      (selectedFilter === 'support' && item.type === 'support')
    );
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
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Sessions', icon: Calendar },
                { key: 'therapy', label: 'Therapy Sessions', icon: Brain },
                { key: 'support', label: 'Support Chats', icon: MessageSquare },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
              {getFilteredHistory().map((item) => (
                <Card key={item.id} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {item.notes}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Duration: {item.duration}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getFilteredHistory().length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No emotional therapy sessions found
                </h3>
                <p className="text-muted-foreground">
                  Start your emotional wellness journey to see your progress history here.
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
