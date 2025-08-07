import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Gamepad2, LineChart, Smile, User, Settings } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { motion } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";

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
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const therapyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const motivationRef = useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = useState<string | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
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
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
        <div className="w-6 h-6 rounded-full bg-orange-400" />

        {[{ ref: therapyRef, icon: Gamepad2, label: "Games", id: "Games" }, { ref: progressRef, icon: LineChart, label: "Progress", id: "progress" }, { ref: motivationRef, icon: Smile, label: "Motivation", id: "motivation" }].map(({ ref, icon: Icon, label, id }) => (
          <div key={id} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} className="relative group">
            <button onClick={() => scrollToRef(ref)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${hovered === id ? "bg-muted" : ""}`}>
              <Icon className="text-foreground" size={22} />
            </button>

            {hovered === id && (
              <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 12 }} exit={{ opacity: 0, x: 5 }}
                className="absolute left-[38px] bottom-0 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-md border border-border z-10 w-30 space-y-1">
                {label}
              </motion.div>
            )}
          </div>
        ))}

        <div className="flex-1" />

        <div className="relative" onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setShowUserMenu(true); }} onMouseLeave={() => { hideTimer.current = setTimeout(() => setShowUserMenu(false), 200); }}>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition">
            <User className="w-6 h-6 text-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-4 z-50 space-y-2">
              <button onClick={() => setLocation("/settings")} className="w-full px-5 py-3 text-sm flex items-center gap-3 hover:bg-muted rounded-lg">
                <Settings className="w-5 h-5" />
                <span className="text-foreground font-medium">Settings</span>
              </button>
              <div className="border-t border-border my-1" />
              <LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-muted text-foreground font-medium flex items-center gap-3 rounded-lg" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 pb-24 w-full">
        <header className="flex justify-between items-center py-6">
          <div />
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <span className="bg-muted text-foreground px-4 py-1 rounded-full text-sm font-medium">
              Hi {(user as any)?.firstName}
            </span>
            <LogoutButton />
          </div>
        </header>

        <section ref={therapyRef} className="text-center py-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🎮 Gamified Speech Therapy</h2>
            <p className="text-muted-foreground mb-6">Play, speak, and grow through interactive word games.</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="bg-card text-card-foreground shadow rounded-xl px-6 py-5 text-left border border-border">
                <h3 className="font-semibold">Word Match</h3>
                <p className="text-sm text-muted-foreground">Match spoken words to correct visuals.</p>
              </div>
              <div className="bg-card text-card-foreground shadow rounded-xl px-6 py-5 text-left border border-border">
                <h3 className="font-semibold">Say It Fast</h3>
                <p className="text-sm text-muted-foreground">Speed practice with tongue twisters.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section ref={progressRef} className="text-center py-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">📊 Progress Tracking</h2>
            <p className="text-muted-foreground mb-6">See how far you've come on your fluency journey.</p>
            <div className="flex justify-center gap-6">
              <div className="bg-card text-card-foreground border border-border px-6 py-4 rounded-lg shadow text-center w-40">
                <p className="text-sm text-muted-foreground">Words</p>
                <p className="text-xl font-bold text-[#ff6b1d]">73</p>
              </div>
              <div className="bg-card text-card-foreground border border-border px-6 py-4 rounded-lg shadow text-center w-40">
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-xl font-bold text-[#ff6b1d]">18</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section ref={motivationRef} className="text-center py-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🤖 Motivational AI Avatar</h2>
            <p className="text-muted-foreground mb-6">Your friendly companion is here to cheer you on.</p>
            <div className="bg-card text-card-foreground px-8 py-6 rounded-xl shadow border border-border">
              <p className="text-lg font-semibold">"You’re doing amazing, keep it up!"</p>
              <p className="text-muted-foreground mt-2">— Ava, your Fluency Buddy</p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
