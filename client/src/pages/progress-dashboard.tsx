import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

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
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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
      {/* Sidebar (unchanged) */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-40 border-r border-border">
        <div className="w-6 h-6 rounded-full bg-orange-400" />
        {[
          { icon: Gamepad2, label: "Games", path: "/speech-therapy", id: "Games" },
          { icon: LineChart, label: "Progress", path: "/progress-dashboard", id: "progress" },
          { icon: Smile, label: "Motivation", path: "/child-dashboard#motivation", id: "motivation" },
        ].map(({ icon: Icon, label, path, id }) => (
          <div key={id} className="relative group">
            <button
              onClick={() => setLocation(path)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition"
              aria-label={label}
            >
              <Icon className="w-6 h-6" />
            </button>
            <div className="pointer-events-none absolute left-[38px] bottom-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-3 transition bg-popover text-popover-foreground text-sm font-medium px-3 py-1 rounded-lg border border-border shadow">
              {label}
            </div>
          </div>
        ))}
      </aside>

      {/* Main */}
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
