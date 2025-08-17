import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Home, BarChart, History, MessageSquare, Settings, ThumbsUp, Calendar, Clock, Brain, Mic, FileText } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { motion } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'therapy' | 'support'>('all');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-600">Loading...</p>
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
      case 'therapy': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'support': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-green-900/20 dark:to-teal-900/20">
      {/* Sidebar */}
      <motion.div 
        ref={sidebarRef}
        className="w-20 flex flex-col items-center py-6 bg-white/80 backdrop-blur-sm border-r border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-6 h-full">
          {/* Top Navigation */}
          <div className="flex flex-col items-center space-y-4">
            <motion.a href="/adult-dashboard" className="group">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
                <Home className="w-5 h-5" />
              </div>
            </motion.a>
            <motion.a href="/adult-insights" className="group">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200">
                <BarChart className="w-5 h-5" />
              </div>
            </motion.a>
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <History className="w-5 h-5" />
            </div>
            <button 
              onClick={() => setIsFeedbackOpen(true)} 
              className="group"
              aria-label="Open feedback form"
            >
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors duration-200">
                <ThumbsUp className="w-5 h-5" />
              </div>
            </button>
            <motion.a href="/emotional-support" className="group">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200">
                <Brain className="w-5 h-5" />
              </div>
            </motion.a>
          </div>

          {/* Bottom Section */}
          <div className="flex-1 flex flex-col justify-end space-y-4">
            <button 
              onClick={() => setShowAdultSettings(true)} 
              className="group"
              aria-label="Open settings"
            >
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <Settings className="w-5 h-5" />
              </div>
            </button>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <LogoutButton />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 bg-white/50 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Emotional Therapy History</h1>
              <p className="text-gray-600 dark:text-gray-400">Review your emotional wellness sessions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
          </div>
        </div>

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
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <Card key={item.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {item.notes}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(item.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{item.time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>Duration: {item.duration}</span>
                              </div>
                            </div>
                          </div>
                          
                          {item.mood && (
                            <div className="text-right">
                              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {item.mood}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Mood Journey
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getFilteredHistory().length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No emotional therapy sessions found
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Start your emotional wellness journey to see your progress history here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adult Settings Modal */}
      <AdultSettings
        isOpen={showAdultSettings}
        onClose={() => setShowAdultSettings(false)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Adult Feedback Modal */}
      {isFeedbackOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsFeedbackOpen(false)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Feedback</h2>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How helpful was this emotional therapy review?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Share your thoughts about your emotional wellness journey..."
                />
              </div>

              <button className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors">
                Submit Feedback
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
