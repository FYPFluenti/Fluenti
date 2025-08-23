import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Gamepad2, LineChart, Smile, User, Settings, SlidersHorizontal, Lock, ArrowRight } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { motion } from "framer-motion";
import { Star, ThumbsUp, Clock, Mic, MicOff } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import FluentiLogo from "@/components/FluentiLogo";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showChatUI, setShowChatUI] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [listening, setListening] = useState(false);

  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);

  const submitFeedback = () => {
    // TODO: send to your API
    setShowFeedback(false);
    setFeedback("");
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
    <div className="h-screen font-sans flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
        {/* Sidebar brand (logo with hover + tooltip) */}
        <div
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered(null)}
          className="relative group"
        >
          <button
            onClick={() => setLocation("/")}
            aria-label="Go to home"
            className="w-12 h-12 grid place-items-center rounded-xl transition"
          >
            <FluentiLogo
              className="w-10 h-10 text-[#ff6b1d] transition-colors duration-150 group-hover:text-[#ff8a4a]"
            />
          </button>

          {hovered === "home" && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 12 }}
              exit={{ opacity: 0, x: 5 }}
              className="absolute left-[38px] bottom-1 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-md border border-border z-10"
            >
              home
            </motion.div>
          )}
        </div>

        {/* Sidebar Buttons */}
        {[
  { icon: Gamepad2, label: "games", id: "games", path: "/speech-therapy" },
  { icon: LineChart, label: "progress", id: "progress", path: "/progress-dashboard" },
  { icon: Smile, label: "feedback", id: "feedback" },
].map(({ icon: Icon, label, id, path }) => (
  <div
    key={id}
    onMouseEnter={() => setHovered(id)}
    onMouseLeave={() => setHovered(null)}
    className="relative group"
  >
    <button
      onClick={() =>
        id === "feedback"
          ? setShowFeedback(true)
          : path && setLocation(path)
      }
      className="w-10 h-10 flex items-center justify-center rounded-xl transition group"
      aria-label={label}
    >
      <Icon className="text-foreground w-7 h-7 transition-colors duration-150 group-hover:text-muted-foreground" />
    </button>

    {hovered === id && (
      <motion.div
        initial={{ opacity: 0, x: 5 }}
        animate={{ opacity: 1, x: 12 }}
        exit={{ opacity: 0, x: 5 }}
        className="absolute left-[38px] bottom-0 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-md border border-border z-10 w-30 space-y-1"
      >
        {label}
      </motion.div>
    )}
  </div>
))}

        <div className="flex-1" />

        <div 
          className="relative" 
          onMouseEnter={() => { 
            if (hideTimer.current) clearTimeout(hideTimer.current); 
            setShowUserMenu(true); 
          }} 
          onMouseLeave={() => { 
            hideTimer.current = setTimeout(() => setShowUserMenu(false), 200); 
          }}
        >
          <button
            className="group w-10 h-10 flex items-center justify-center rounded-full transition"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            title="User menu"
          >
            <User
              className={`w-7 h-7 transition-colors duration-150 ${
                showUserMenu
                  ? "text-muted-foreground"
                  : "text-muted-foreground group-hover:text-muted-foreground"
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-4 z-50 space-y-2">
              <button 
                onClick={() => setLocation("/settings")} 
                className="w-full px-5 py-3 text-sm flex items-center gap-3 hover:bg-muted hover:brightness-90 rounded-lg"
              >
                <Settings className="w-5 h-5" />
                <span className="text-foreground font-medium">Settings</span>
              </button>
              <div className="border-t border-border my-1" />
<LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white bg-orange-500 text-white font-medium flex items-center gap-3 rounded-lg" />            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 w-full h-screen overflow-hidden flex flex-col">
        <header className="flex justify-between items-center py-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Dark Mode</span>
              <DarkModeToggle />
            </div>
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-2 rounded-full hover:bg-muted transition"
              aria-label="Toggle preferences"
              title="Preferences"
            >
              <SlidersHorizontal className="w-6 h-6 text-foreground" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="text-center py-10 flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="max-w-xl mx-auto"
          >
            <iframe
              src="https://your-avatar-url.readyplayer.me/avatar"
              allow="camera *; microphone *"
              className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full mb-8"
              title="AI Avatar"
            />
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

        {/* Preferences Modal */}
        {showPreferences && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-20 right-10 w-[360px] bg-popover border border-border rounded-xl shadow-xl p-6 space-y-4 z-50"
          >
            <div>
              <h3 className="text-lg font-semibold">Preferences</h3>
              <p className="text-sm text-muted-foreground">Set how the assistant works for you</p>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Language</h4>
                  <p className="text-xs text-muted-foreground">Conversation only</p>
                </div>
                <select 
                  className="bg-card text-foreground border border-border rounded-md px-3 py-1 text-sm font-dm-sans focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Select conversation language"
                  title="Select conversation language"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[500px] max-w-[92vw] rounded-2xl bg-popover border border-border shadow-2xl">
              <div className="p-6">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="how can we improve fluenti?"
                  className="w-full h-32 resize-none rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/70 p-4 focus:outline-none focus:ring-0 focus:border-border shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between px-6 pb-6">
                <button
                  onClick={() => { setShowFeedback(false); setFeedback(""); }}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
                >
                  cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={!feedback.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
                  style={{ backgroundColor: "hsl(27, 95%, 61%)" }}
                >
                  submit
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <iframe
                      src="https://your-avatar-url.readyplayer.me/avatar"
                      allow="camera *; microphone *"
                      className="absolute inset-0 w-full h-full"
                      title="AI Avatar"
                    />
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