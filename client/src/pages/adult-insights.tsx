import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Home, BarChart, History, MessageSquare, Settings, ThumbsUp, TrendingUp, Brain, Target, Calendar } from "lucide-react";
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

export default function AdultInsights() {
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  const [showAdultSettings, setShowAdultSettings] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
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
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <BarChart className="w-5 h-5" />
            </div>
            <motion.a href="/adult-history" className="group">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200">
                <History className="w-5 h-5" />
              </div>
            </motion.a>
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
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Insights & Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your speech therapy progress</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Overall Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">87%</div>
                  <p className="text-xs text-green-600 dark:text-green-400">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Brain className="w-4 h-4" />
                    <span>Sessions Completed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">This month</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Target className="w-4 h-4" />
                    <span>Goals Achieved</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">8/10</div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Monthly goals</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Streak</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">12 days</div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Current streak</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Weekly Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Progress chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Speech Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Accuracy trends will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { activity: "Completed phonetic exercise", time: "2 hours ago", score: "95%" },
                    { activity: "Voice modulation practice", time: "1 day ago", score: "87%" },
                    { activity: "Emotional support session", time: "2 days ago", score: "92%" },
                    { activity: "Breathing exercises", time: "3 days ago", score: "88%" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.activity}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">{item.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  How was your therapy progress today?
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
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Share your thoughts about your progress..."
                />
              </div>

              <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors">
                Submit Feedback
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
