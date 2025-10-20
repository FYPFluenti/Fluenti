import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";

// Demo avatars
const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb" ,
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb", 
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",  
};

interface User {
  firstName?: string;
  lastName?: string;
}

export default function AdultDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAdultSettings, setShowAdultSettings] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>(
    (localStorage.getItem('language') as 'en' | 'ur') || 'en'
  );

 

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
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
    <div className="min-h-screen lg:h-screen font-sans flex bg-background text-foreground lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedSidebarEmotional 
          onFeedbackOpen={() => setShowFeedback(true)}
          currentPage="home"
        />
      </div>

      {/* Main Content */}
      <main className="lg:ml-20 px-4 lg:px-6 w-full min-h-screen lg:h-screen lg:overflow-hidden flex flex-col pb-20 lg:pb-0">
        <PageHeader />

        <section className="text-center py-10 flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="max-w-xl mx-auto"
          >
            <div className="mx-auto mb-8">
              <ModelViewerAvatar
                avatarUrl={avatarUrls.professional}
                size="large"
                className="mx-auto mb-8"
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Ready for a calming session?</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => setLocation('/emotional-support-voice')} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold">Voice Mode</h3>
                  <p className="text-sm text-muted-foreground">Say Hi to Your Avatar</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setLocation('/emotional-support-chat')} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold">Chat Mode</h3>
                  <p className="text-sm text-muted-foreground">Type to Your Avatar</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>

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
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="dashboard"
        userType="adult"
      />
    </div>
  );
}
