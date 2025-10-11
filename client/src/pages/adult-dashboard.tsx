import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowRight, SlidersHorizontal, User } from "lucide-react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, Clock, Mic, MicOff } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import FeedbackModal from "@/components/layout/FeedbackModel";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [listening, setListening] = useState(false);
  const [showAdultSettings, setShowAdultSettings] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>(
    (localStorage.getItem('language') as 'en' | 'ur') || 'en'
  );
  
  // Note: Emotional Support Chat functionality moved to /emotional-support page
  // These states are kept for potential future use but chat UI removed

  const therapyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const motivationRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (val: 'en' | 'ur') => {
    setLanguage(val);
    localStorage.setItem('language', val);  // Persist for modes
  };

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
    <div className="min-h-screen font-sans flex bg-background text-foreground">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="home"
      />

      {/* Main Content */}
      <main className="ml-20 px-6 pb-24 w-full">
        <header className="flex justify-between items-center py-6 ">
          <div />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">gen z mode</span>
              <DarkModeToggle />
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 rounded-full hover:bg-muted transition"
              aria-label="Open preferences"
              title="Preferences"
            >
              <SlidersHorizontal className="w-6 h-6 text-foreground" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section ref={therapyRef} className="text-center py-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
            <iframe
              src="https://your-avatar-url.readyplayer.me/avatar"
              allow="camera *; microphone *"
              className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full mb-8"
              title="AI Avatar"
            />
            <h2 className="text-2xl font-bold mb-4">coffee and calmi time?</h2>
            
            {/* Skeleton Mode Controls */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-muted text-foreground'
                  }`}
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                    language === 'ur' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-muted text-foreground'
                  }`}
                  onClick={() => handleLanguageChange('ur')}
                >
                  اردو
                </button>
              </div>
              
              <div className="space-y-3">
                <Link href="/emotional-support">
                  <button className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                    <div>
                      <h3 className="text-base font-semibold">Chat Mode</h3>
                      <p className="text-sm text-muted-foreground">Type your messages</p>
                    </div>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                
                <Link href="/emotional-support-voice">
                  <button className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                    <div>
                      <h3 className="text-base font-semibold">Voice Mode</h3>
                      <p className="text-sm text-muted-foreground">Speak your messages</p>
                    </div>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Preferences Modal (triggered on preferences button click) */}
        {showPreferences && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowPreferences(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] bg-popover border border-border rounded-2xl shadow-xl p-8 z-50"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-2">preferences</h3>
                <p className="text-muted-foreground">set how calmi works for you</p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">language</h4>
                    <p className="text-sm text-muted-foreground">conversation only</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'ur')}
                    aria-label="Select conversation language"
                    title="Select conversation language"
                  >
                    <option value="en">english</option>
                    <option value="ur">urdu</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">voice</h4>
                    <p className="text-sm text-muted-foreground">coming soon</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    disabled
                    aria-label="Select voice"
                    title="Select voice"
                  >
                    <option value="female">femme</option>
                    <option value="male">male</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">session mode</h4>
                    <p className="text-sm text-muted-foreground">choose your session style</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    aria-label="Select session mode"
                    title="Select session mode"
                  >
                    <option value="classic">classic</option>
                    <option value="therapeutic">therapeutic</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
        />

        {showVoiceUI && (
          <div className="fixed inset-0 bg-background flex">
            {/* Close */}
            <button
              onClick={() => { setListening(false); setShowVoiceUI(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close voice chat"
            >
              ✕
            </button>

            {/* Sidebar (same as text mode) */}
            <aside className="w-16 shrink-0 border-r border-border bg-background flex flex-col items-center py-6 gap-8">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
              <Star className="w-6 h-6 text-muted-foreground" />
              <Clock className="w-6 h-6 text-muted-foreground" />
              <ThumbsUp className="w-6 h-6 text-muted-foreground" />
              <User className="w-6 h-6 text-muted-foreground mt-auto" />
            </aside>

            {/* Main: big centered avatar */}
            <main className="flex-1 grid place-items-center p-6">
              <div className="flex flex-col items-center gap-8">
                {/* Avatar circle */}
                <div className="relative">
                  {/* neon ring */}
                  <div className="absolute inset-0 -m-3 rounded-full border-4 border-cyan-300/90 blur-[0.3px]" />
                  {/* clip the iframe to a circle */}
                  <div className="relative rounded-full overflow-hidden bg-[#1f2028]
                                  w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80">
                    <iframe
                      src="https://your-avatar-url.readyplayer.me/avatar"
                      allow="camera *; microphone *"
                      className="absolute inset-0 w-full h-full"
                      title="AI Avatar"
                    />
                  </div>
                </div>

                {/* Control bar beneath the avatar */}
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

        {/* Adult Settings Modal */}
        <AdultSettings
          isOpen={showAdultSettings}
          onClose={() => setShowAdultSettings(false)}
          language={language}
          onLanguageChange={setLanguage}
        />
      </main>
    </div>
  );
}
