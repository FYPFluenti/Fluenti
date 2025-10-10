import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp, Clock, Mic, MicOff, User, Gamepad2, LineChart, Smile, Settings, SlidersHorizontal } from "lucide-react";
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
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [listening, setListening] = useState(false);
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
            <div className="w-full">
              <button 
                onClick={() => setShowVoiceUI(true)} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-full max-w-sm mx-auto flex items-center justify-between hover:bg-muted transition-all child-dashboard-button"
              >
                <div>
                  <h3 className="text-base font-semibold">Start Speech Practice</h3>
                  <p className="text-sm text-muted-foreground">Talk with your AI friend!</p>
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

        {/* Voice UI Modal */}
        {showVoiceUI && (
          <div className="fixed inset-0 bg-background flex">
            <button
              onClick={() => { setListening(false); setShowVoiceUI(false); }}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground text-2xl"
              aria-label="Close voice chat"
            >
              ✕
            </button>

            <aside className="w-16 shrink-0 border-r border-border bg-background flex flex-col items-center py-6 gap-8">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
              <Star className="w-6 h-6 text-muted-foreground" />
              <Clock className="w-6 h-6 text-muted-foreground" />
              <ThumbsUp className="w-6 h-6 text-muted-foreground" />
              <User className="w-6 h-6 text-muted-foreground mt-auto" />
            </aside>

            <main className="flex-1 grid place-items-center p-4 sm:p-6">
              <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-0 -m-2 sm:-m-3 rounded-full border-2 sm:border-4 border-cyan-300/90 blur-[0.3px]" />
                  <div className="relative rounded-full overflow-hidden bg-[#1f2028] w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
                    <div className="absolute inset-0 w-full h-full">
                      <ModelViewerAvatar
                        avatarUrl={avatarUrls.professional}
                        size="large"
                        className="absolute inset-0 w-full h-full"
                        //animate={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-md sm:max-w-lg border border-border rounded-xl bg-card p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {listening ? "Listening…" : "Ready to talk"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {listening ? "Speak to your AI avatar" : "Tap the mic to start"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button
                      onClick={() => setListening(false)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted text-lg"
                      aria-label="stop listening"
                      title="stop listening"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setListening(v => !v)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 transition"
                      aria-label="toggle microphone"
                      title="toggle microphone"
                    >
                      {listening ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-black" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </main>
    </div>
  );
}