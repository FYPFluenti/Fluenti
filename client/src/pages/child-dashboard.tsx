import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import FluentiLogo from "@/components/FluentiLogo";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";
import SharedSidebar from "@/components/layout/SharedSidebar";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { LogoutButton } from "@/components/auth/LogoutButton";

// Demo avatars - choose your favorites!
const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb", // Friendly female
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb",     // Child-friendly
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",  // Professional male
};

interface User {
  firstName?: string;
  lastName?: string;
}

export default function ChildDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
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
    <div className="h-screen font-sans flex bg-background text-foreground overflow-hidden child-dashboard-no-zoom">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="dashboard"
      />

      {/* Main Content */}
      <main className="ml-20 px-4 sm:px-6 w-full h-screen overflow-hidden flex flex-col child-dashboard-container">
        <PageHeader />

        <section className="text-center py-6 sm:py-10 flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="max-w-lg mx-auto w-full px-4"
          >
            <div className="mx-auto mb-6 sm:mb-8 flex justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 child-dashboard-avatar">
                <ModelViewerAvatar
                  avatarUrl={avatarUrls.therapist}
                  size="large"
                  className="w-full h-full"
                  //animate={true}
                />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center justify-center gap-2">
              Ready to Practice Speaking? 
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-[#F5B82E]" />
            </h2>
            <div className="w-full space-y-4">
              <button 
                onClick={() => setLocation('/voice-model')} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-full max-w-sm mx-auto flex items-center justify-between hover:bg-muted transition-all child-dashboard-button"
              >
                <div>
                  <h3 className="text-base font-semibold">Start Speech Practice</h3>
                  <p className="text-sm text-muted-foreground">Talk with your AI friend!</p>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>

              <button 
                onClick={() => setLocation('/onboarding')} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white border-[#F5B82E] w-full max-w-sm mx-auto flex items-center justify-between hover:shadow-lg transition-all duration-200"
              >
                <div>
                  <h3 className="text-base font-semibold">Take Assessment</h3>
                  <p className="text-sm text-white/90">Get personalized learning recommendations!</p>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </motion.div>
        </section>
        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
        />


      </main>
    </div>
  );
}