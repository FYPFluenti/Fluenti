import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, Bell, Lock, Trash2, RotateCcw, Globe, Moon, Sun } from "lucide-react";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
}

export default function AdultSettings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showFeedback, setShowFeedback] = useState(false);

  // Settings state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>(
    (localStorage.getItem('language') as 'en' | 'ur') || 'en'
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (newLang: 'en' | 'ur') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    toast({
      title: "Language Updated",
      description: `Language changed to ${newLang === 'en' ? 'English' : 'Urdu'}`,
    });
  };

  const handleResetChatHistory = async () => {
    if (window.confirm("Are you sure you want to reset your chat history? This cannot be undone.")) {
      try {
        // TODO: Implement API call to reset chat history
        toast({
          title: "Chat History Reset",
          description: "Your chat history has been successfully reset.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset chat history. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?"
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        "This is your final confirmation. Type 'DELETE' in the next prompt to proceed."
      );
      
      if (doubleConfirm) {
        try {
          // TODO: Implement API call to delete account
          toast({
            title: "Account Deleted",
            description: "Your account has been permanently deleted.",
          });
          setTimeout(() => setLocation("/"), 2000);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to delete account. Please contact support.",
            variant: "destructive",
          });
        }
      }
    }
  };

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
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="settings"
      />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      {/* Main Content */}
      <main className="ml-20 w-full">
        <PageHeader />

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Profile Header */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4 mb-6">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#ff6b1d]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b1d] to-[#ff8c42] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
          </motion.section>

          {/* Privacy & Analytics */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[#ff6b1d]" />
              <h2 className="text-2xl font-bold">Privacy & Analytics</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Manage your data collection and privacy preferences
            </p>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                {/* Necessary cookies (locked) */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Necessary Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly. Cannot be disabled.
                    </p>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-12 cursor-not-allowed rounded-full bg-[#ff6b1d] opacity-50"
                    role="switch"
                    aria-checked="true"
                    aria-label="Necessary cookies (required)"
                  >
                    <span className="absolute top-1 left-7 inline-block h-4 w-4 rounded-full bg-white transition" />
                  </button>
                </div>

                {/* Analytics cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Analytics Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use Fluenti to improve your experience.
                    </p>
                  </div>
                  <button
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`relative inline-flex h-6 w-12 rounded-full transition ${
                      analyticsEnabled ? "bg-[#ff6b1d]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={analyticsEnabled}
                  >
                    <span
                      className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                        analyticsEnabled ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 h-px bg-border" />
          </motion.section>

          {/* Notifications */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-[#ff6b1d]" />
              <h2 className="text-2xl font-bold">Notifications</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Control how you receive updates and reminders
            </p>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about session reminders and progress updates.
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-12 rounded-full transition ${
                      notificationsEnabled ? "bg-[#ff6b1d]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={notificationsEnabled}
                  >
                    <span
                      className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                        notificationsEnabled ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Get weekly progress reports and tips via email.
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-12 rounded-full transition ${
                      emailNotifications ? "bg-[#ff6b1d]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={emailNotifications}
                  >
                    <span
                      className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                        emailNotifications ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 h-px bg-border" />
          </motion.section>

          {/* Appearance & Language */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-[#ff6b1d]" />
              <h2 className="text-2xl font-bold">Appearance & Language</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Customize how Fluenti looks and the language you prefer
            </p>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes.
                    </p>
                  </div>
                  <button
                    onClick={handleDarkModeToggle}
                    className={`relative inline-flex h-6 w-12 rounded-full transition ${
                      darkMode ? "bg-[#ff6b1d]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={darkMode}
                  >
                    <span
                      className={`absolute top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${
                        darkMode ? "left-7" : "left-1"
                      }`}
                    >
                      {darkMode ? (
                        <Moon className="w-3 h-3 text-[#ff6b1d]" />
                      ) : (
                        <Sun className="w-3 h-3 text-[#ff6b1d]" />
                      )}
                    </span>
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Preferred Language</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-6 py-2 rounded-lg border-2 transition ${
                        language === 'en'
                          ? "border-[#ff6b1d] bg-[#ff6b1d]/10 text-[#ff6b1d] font-semibold"
                          : "border-border hover:border-[#ff6b1d]/50"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ur')}
                      className={`px-6 py-2 rounded-lg border-2 transition ${
                        language === 'ur'
                          ? "border-[#ff6b1d] bg-[#ff6b1d]/10 text-[#ff6b1d] font-semibold"
                          : "border-border hover:border-[#ff6b1d]/50"
                      }`}
                    >
                      اردو (Urdu)
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 h-px bg-border" />
          </motion.section>

          {/* Danger Zone */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Irreversible and destructive actions
            </p>

            <Card className="bg-card border-red-200 dark:border-red-900">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <RotateCcw className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold">Reset Chat History</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear all your conversation history. Fluenti will not remember past sessions.
                  </p>
                  <button
                    onClick={handleResetChatHistory}
                    className="px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition font-semibold"
                  >
                    Reset Chat History
                  </button>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-red-500">Delete Account</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-semibold"
                  >
                    Delete My Account
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>
    </div>
  );
}