import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Gamepad2, LineChart, Smile, User, Settings, SlidersHorizontal, Lock, ArrowRight } from "lucide-react";
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
  const [showPreferences, setShowPreferences] = useState(false);

  

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
              <Icon className="text-foreground w-7 h-7" />
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
            <User className="w-7 h-7 text-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-4 z-50 space-y-2">
             <button onClick={() => setLocation("/settings")} className="w-full px-5 py-3 text-sm flex items-center gap-3 hover:bg-muted hover:brightness-90 rounded-lg">
                <Settings className="w-5 h-5" />
                <span className=" text-foreground font-medium">Settings</span>
              </button>
              <div className="border-t border-border my-1" />
              <LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-muted hover:brightness-90 text-foreground font-medium flex items-center gap-3 rounded-lg" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 pb-24 w-full">
        <header className="flex justify-between items-center py-6 ">
          <div />
          <div className="flex items-center gap-6">
  <div className="flex items-center gap-2">
    <span className="text-lg font-semibold">Dark Mode</span>
    <DarkModeToggle />
  </div>
  <button
    onClick={() => setShowPreferences(!showPreferences)}
    className="p-2 rounded-full hover:bg-muted transition"
  >
    <SlidersHorizontal className="w-6 h-6 text-foreground" />
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
            <h2 className="text-2xl font-bold mb-4">Feeling stuck?</h2>
            <div className="space-y-3">
              <button className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                <div>
                  <h3 className="text-base font-semibold">voice mode</h3>
                  <p className="text-sm text-muted-foreground">Say Hi to Your Avatar</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                <div>
                  <h3 className="text-base font-semibold">text mode</h3>
                  <p className="text-sm text-muted-foreground">Need a break from talking?</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>
{/* Preferences Modal (triggered on preferences button click) */}
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
        <select className="bg-card text-foreground border border-border rounded-md px-3 py-1 text-sm font-dm-sans focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="en">English</option>
          <option value="ur">Urdu</option>
        </select>
      </div>

    </div>
  </motion.div>
)}

{/* Preferences Button */}
<button
  onClick={() => setShowPreferences(!showPreferences)}
  className="p-2 rounded-full hover:bg-muted transition fixed top-6 right-6 z-50"
>
  <SlidersHorizontal className="w-6 h-6 text-foreground" />
</button>

      
      </main>
    </div>
  );
}
