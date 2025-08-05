import { useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Gamepad2, LineChart, Smile } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { motion } from "framer-motion";

export default function ChildDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: { firstName?: string };
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();

  const therapyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const motivationRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#ff6b1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ff6b1d]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-[#fdfaf5] text-[#111] font-sans">
      {/* Sidebar */}
      <aside className="w-20 bg-white border-r border-orange-100 flex flex-col items-center py-6 space-y-8 sticky top-0 h-screen z-50">
        <div className="w-10 h-10 rounded-full bg-[#ff6b1d]"></div>
        <button onClick={() => scrollToRef(therapyRef)} title="Speech Therapy">
          <Gamepad2 className="text-gray-500 hover:text-[#ff6b1d]" />
        </button>
        <button onClick={() => scrollToRef(progressRef)} title="Progress">
          <LineChart className="text-gray-500 hover:text-[#ff6b1d]" />
        </button>
        <button onClick={() => scrollToRef(motivationRef)} title="Motivation">
          <Smile className="text-gray-500 hover:text-[#ff6b1d]" />
        </button>
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-24">
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <h1 className="text-xl font-bold tracking-tight">FLUENTI</h1>
          <div className="flex space-x-4 items-center">
            <span className="bg-[#ffe6d5] text-[#111] px-4 py-1 rounded-full text-sm font-medium">
              Hi {user?.firstName}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Gamified Speech Therapy */}
        <section ref={therapyRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#ff6b1d]">🎮 Gamified Speech Therapy</h2>
            <p className="text-gray-600 mb-6">Play, speak, and grow through interactive word games.</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="bg-white shadow rounded-xl px-6 py-4 text-left">
                <h3 className="font-semibold text-[#111]">Word Match</h3>
                <p className="text-sm text-gray-500">Match spoken words to correct visuals.</p>
              </div>
              <div className="bg-white shadow rounded-xl px-6 py-4 text-left">
                <h3 className="font-semibold text-[#111]">Say It Fast</h3>
                <p className="text-sm text-gray-500">Speed practice with tongue twisters.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Progress Tracking */}
        <section ref={progressRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#ff6b1d]">📊 Progress Tracking</h2>
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

        {/* Motivation */}
        <section ref={motivationRef} className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#ff6b1d]">🤖 Motivational AI Avatar</h2>
            <p className="text-gray-600 mb-6">Your friendly companion is here to cheer you on.</p>
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
