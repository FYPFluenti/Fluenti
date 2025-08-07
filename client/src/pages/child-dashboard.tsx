import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Gamepad2, LineChart, Smile, User, Settings } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#ff6b1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ff6b1d]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans flex">
      {/* Sidebar */}
      <aside className="w-20 bg-white flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-gray-200 shadow-sm">
        {/* Orange Dot */}
        <div className="w-6 h-6 rounded-full bg-orange-400" />

        {/* Sidebar Buttons */}
        {[
          { ref: therapyRef, icon: Gamepad2, label: "Therapy", id: "therapy" },
          { ref: progressRef, icon: LineChart, label: "Progress", id: "progress" },
          { ref: motivationRef, icon: Smile, label: "Motivation", id: "motivation" },
        ].map(({ ref, icon: Icon, label, id }) => (
          <div
            key={id}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className="relative group"
          >
            <button
              onClick={() => scrollToRef(ref)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
                hovered === id ? "bg-gray-100" : ""
              }`}
            >
              <Icon className="text-[#111]" size={22} />
            </button>

            {hovered === id && (
              <motion.div
              initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: 1, x: 12 }}
      exit={{ opacity: 0, x: 5 }}
      className="absolute left-12 bottom-0 bg-white text-base font-semibold text-[#111] px-4 py-2 rounded-lg shadow-md border border-gray-100 z-10 w-30 space-y-1"
    >
    {label}
              </motion.div>
            )}
          </div>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Avatar + Popover */}
        <div
  className="relative"
  onMouseEnter={() => setShowUserMenu(true)}
  onMouseLeave={() => setShowUserMenu(false)}
>
  <button
    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
  >
    <User className="w-6 h-6 text-gray-800" />
  </button>

  {showUserMenu && (
    <div className="absolute left-12 bottom-0 w-44 bg-white border border-gray-200 rounded-xl shadow-md p-2 z-50">
      <button
        onClick={() => setLocation("/settings")}
        className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 rounded-md"
      >
        <Settings className="w-4 h-4" />
        <span className="text-[#111] font-medium">settings</span>
      </button>
      <div className="border-t border-gray-200 my-1" />
      <LogoutButton className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-[#111] font-medium flex items-center gap-2 rounded-md" />
    </div>
  )}
</div>

      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 pb-24 w-full">
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <h1 className="text-xl font-bold tracking-tight">FLUENTI</h1>
          <div className="flex space-x-4 items-center">
            <span className="bg-[#ffedd5] text-[#111] px-4 py-1 rounded-full text-sm font-medium">
              Hi {(user as any)?.firstName}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Section: Therapy */}
        <section ref={therapyRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">🎮 Gamified Speech Therapy</h2>
            <p className="text-gray-600 mb-6">Play, speak, and grow through interactive word games.</p>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="bg-white shadow rounded-xl px-6 py-4 text-left">
                <h3 className="font-semibold">Word Match</h3>
                <p className="text-sm text-gray-500">Match spoken words to correct visuals.</p>
              </div>
              <div className="bg-white shadow rounded-xl px-6 py-4 text-left">
                <h3 className="font-semibold">Say It Fast</h3>
                <p className="text-sm text-gray-500">Speed practice with tongue twisters.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section: Progress */}
        <section ref={progressRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">📊 Progress Tracking</h2>
            <p className="text-gray-600 mb-6">See how far you've come on your fluency journey.</p>

            <div className="flex justify-center gap-6">
              <div className="bg-white px-6 py-4 rounded-lg shadow text-center w-40">
                <p className="text-sm text-gray-500">Words</p>
                <p className="text-xl font-bold text-[#ff6b1d]">73</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-lg shadow text-center w-40">
                <p className="text-sm text-gray-500">Sessions</p>
                <p className="text-xl font-bold text-[#ff6b1d]">18</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section: Motivation */}
        <section ref={motivationRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">🤖 Motivational AI Avatar</h2>
            <p className="text-gray-600 mb-6">
              Your friendly companion is here to cheer you on.
            </p>

            <div className="bg-white px-8 py-6 rounded-xl shadow">
              <p className="text-lg font-semibold text-[#111]">"You’re doing amazing, keep it up!"</p>
              <p className="text-gray-500 mt-2">— Ava, your Fluency Buddy</p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
