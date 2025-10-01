import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Settings,
  User,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import FluentiLogo from "@/components/FluentiLogo";

/* ---------- Types ---------- */
interface UserProgress {
  overallAccuracy: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
  level: number;
}
interface SessionData {
  id: string;
  sessionType: string;
  accuracyScore: number;
  wordsCompleted: number;
  createdAt: string;
}

export default function ProgressDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
    toast({
      title: "Feedback submitted! 🌟",
      description: "Thank you for helping us make Fluenti better!",
    });
  };

  const { data: progressData, isLoading: progressLoading, error } = useQuery<{
    progress: UserProgress;
    recentSessions: SessionData[];
    messageCount: number;
  }>({
    queryKey: ["/api/speech/progress"],
    queryFn: async () => {
      await new Promise((res) => setTimeout(res, 300));
      return {
        progress: {
          overallAccuracy: 88,
          sessionsCompleted: 4,
          totalPracticeTime: 120,
          currentStreak: 5,
          longestStreak: 10,
          achievements: ["First Session", "Accuracy 80%"],
          level: 2,
        },
        recentSessions: [
          {
            id: "abc123",
            sessionType: "practice",
            accuracyScore: 90,
            wordsCompleted: 20,
            createdAt: "2024-08-10T12:00:00Z",
          },
        ],
        messageCount: 4,
      };
    },
    enabled: !!isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Failed to load progress data.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Updated Sidebar */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
        {/* Sidebar brand (logo with hover + tooltip) */}
        <div
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered(null)}
          className="relative group"
        >
          <button
            onClick={() => setLocation("/child-dashboard")}
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
              <LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white bg-orange-500 text-white font-medium flex items-center gap-3 rounded-lg" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 w-full">
        {/* Top controls (right) */}
        <header className="flex justify-end items-center gap-4 px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">gen z mode</span>
            <DarkModeToggle />
          </div>
          <button
            onClick={() => setLocation("/child-dashboard?prefs=1")}
            className="p-2 rounded-full hover:bg-muted transition"
            aria-label="Preferences"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </header>

        {/* Date pager pill — SLIGHTLY BIGGER, NO BORDER */}
        <div className="px-5">
          <div className="mx-auto max-w-[600px]">
            <div className="mx-auto h-11 rounded-full bg-neutral-100 dark:bg-muted/30 flex items-center justify-between px-3">
              <button
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-[15px] font-medium tracking-tight select-none">
                aug 4 – aug 10
              </span>
              <button
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Next week"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Title + center content — SLIGHTLY BIGGER */}
        <section className="px-5 pt-9">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[26px] font-bold mb-12">your week</h1>

            {/* Stars illustration — a bit larger */}
            <div className="flex justify-center mb-5">
              <svg width="95" height="95" viewBox="0 0 120 120" fill="none">
                <path d="M60 20l7 18 19 2-15 12 5 18-16-10-16 10 5-18-15-12 19-2 7-18z" fill="#F5B82E" />
                <circle cx="25" cy="75" r="2" fill="#F5B82E" />
                <circle cx="95" cy="60" r="2" fill="#F5B82E" />
                <circle cx="45" cy="95" r="2" fill="#F5B82E" />
              </svg>
            </div>

            <p className="text-[15px] text-muted-foreground mb-5">
              your weekly insights are ready!
            </p>

            <button
              className="inline-flex items-center gap-2 bg-[#F5B82E] text-black px-5 py-2.5 rounded-lg text-[15px] font-semibold hover:opacity-90 transition"
            >
              view now <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </section>
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

        {/* Stats — slightly bigger */}
        <section className="px-5 mt-14 pb-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-border grid place-items-center text-muted-foreground text-xs">⏱</span>
              stats
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5">
                <div className="text-sm text-muted-foreground mb-1.5">convos completed</div>
                <div className="text-[34px] font-bold leading-none">
                  {progressData?.progress.sessionsCompleted ?? "--"}
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-5">
                <div className="text-sm text-muted-foreground mb-1.5">messages</div>
                <div className="text-[34px] font-bold leading-none">
                  {progressData?.messageCount ?? "--"}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}