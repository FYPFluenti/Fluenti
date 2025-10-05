import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp, Clock, Mic, MicOff, User } from "lucide-react";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";
import SharedSidebar from "@/components/layout/SharedSidebar";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";

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
  const [showChatUI, setShowChatUI] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [listening, setListening] = useState(false);

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
    <div className="h-screen font-sans flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="dashboard"
      />

      {/* Main Content */}
      <main className="ml-20 px-6 w-full h-screen overflow-hidden flex flex-col">
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
    avatarUrl={avatarUrls.therapist}
    size="large"
    className="mx-auto mb-8"
    //animate={true}
/>
</div>
            <h2 className="text-2xl font-bold mb-4">Feeling stuck?</h2>
            <div className="space-y-3">
              <button 
                onClick={() => setShowVoiceUI(true)} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold">voice mode</h3>
                  <p className="text-sm text-muted-foreground">Say Hi to Your Avatar</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowChatUI(true)} 
                className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold">text mode</h3>
                  <p className="text-sm text-muted-foreground">Need a break from talking?</p>
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

        {/* Chat UI Modal */}
        {showChatUI && (
          <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
            <button
              onClick={() => setShowChatUI(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>

            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center py-6 gap-8 bg-background border-r border-border">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
              <Star className="w-6 h-6 text-muted-foreground" />
              <Clock className="w-6 h-6 text-muted-foreground" />
              <ThumbsUp className="w-6 h-6 text-muted-foreground" />
              <User className="w-6 h-6 text-muted-foreground mt-auto" />
            </div>

            <div className="flex flex-col items-start pl-24 max-w-3xl w-full">
              <div className="flex items-start gap-3 mb-6">
                <span className="inline-block w-8 h-8 rounded-full bg-[#F5B82E]" />
                <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm">
                  hey there! what's on your mind today?
                </div>
              </div>

              <div className="w-full flex items-center gap-3 border border-border rounded-xl bg-card p-3 shadow-sm">
                <textarea
                  placeholder="type your message..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
                />
                <button className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted">
                  ✕
                </button>
                <button
                  className="w-10 h-10 rounded-full grid place-items-center bg-[#F5B82E]"
                  aria-label="send"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-black">
                    <path fill="currentColor" d="M3 11l18-8-8 18-2-7-8-3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice UI Modal */}
        {showVoiceUI && (
          <div className="fixed inset-0 bg-background flex">
            <button
              onClick={() => { setListening(false); setShowVoiceUI(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
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

            <main className="flex-1 grid place-items-center p-6">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 -m-3 rounded-full border-4 border-cyan-300/90 blur-[0.3px]" />
                  <div className="relative rounded-full overflow-hidden bg-[#1f2028] w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80">
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

                <div className="w-full max-w-lg border border-border rounded-xl bg-card p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {listening ? "Listening…" : "Ready to talk"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {listening ? "Speak to your AI avatar" : "Tap the mic to start"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setListening(false)}
                      className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted"
                      aria-label="stop listening"
                      title="stop listening"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setListening(v => !v)}
                      className="w-12 h-12 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 transition"
                      aria-label="toggle microphone"
                      title="toggle microphone"
                    >
                      {listening ? <Mic className="w-5 h-5 text-black" /> : <MicOff className="w-5 h-5 text-black" />}
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