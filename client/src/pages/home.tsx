import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import FluentiLogo from "@/components/FluentiLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";
import { UserTypeCard } from "@/components/UserTypeCard";

import { 
  MessageCircle, 
  Users, 
  Mic, 
  Brain, 
  BarChart3, 
  Play, 
  Clock, 
  Trophy, 
  Target,
  Settings,
  User,
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal
} from "lucide-react";

// Demo avatars - choose your favorites!
const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb", // Friendly female
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb",     // Child-friendly
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",  // Professional male
};

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Add these new state variables
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Add feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
  };
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    // Handle redirect if needed
  }
}, [isAuthenticated, isLoading, toast]);

if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
  
  // If not authenticated, show landing page
// Enhanced Landing Page Section (replace your current landing content)
if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Keep your existing header */}
      <header className="bg-white/80 backdrop-blur shadow-sm">
        {/* Your existing header code */}
      </header>

      {/* NEW: Hero Section with Samaha */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Meet <span className="text-primary">Samaha</span>
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Your AI Speech Therapy Companion
          </p>
          
          {/* Samaha Avatar */}
          <div className="w-48 h-48 mx-auto mb-8">
            <ModelViewerAvatar 
              avatarUrl={avatarUrls.therapist}
              size="large"
              className="mx-auto"
            />
          </div>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Start your personalized speech therapy journey with Samaha, 
            our AI therapist designed to help you communicate with confidence.
          </p>
        </div>
      </section>

      {/* NEW: User Type Selection */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Choose Your Journey</h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Fluenti adapts to your unique needs and goals
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Child Card */}
            <UserTypeCard
              type="child"
              title="For Kids (4-12)"
              description="Fun, gamified speech therapy"
              avatar={<ModelViewerAvatar avatarUrl={avatarUrls.therapist} size="medium" />}
              features={["🎮 Interactive games", "🏆 Rewards system", "👨‍👩‍👧‍👦 Parent tracking"]}
              ctaText="Start Kids Journey"
              href="/signup?type=child"
            />
            
            {/* Adult Card */}
            <UserTypeCard
              type="adult"
              title="For Adults (13+)"
              description="Professional communication skills"
              avatar={<ModelViewerAvatar avatarUrl={avatarUrls.therapist} size="medium" />}
              features={["💼 Professional focus", "📊 Detailed analytics", "🧠 Emotional support"]}
              ctaText="Begin Adult Program"
              href="/signup?type=adult"
            />
            
            {/* Guardian Card */}
            <UserTypeCard
              type="guardian"
              title="For Parents"
              description="Monitor and support your child"
              avatar={<ModelViewerAvatar avatarUrl={avatarUrls.therapist} size="medium" />}
              features={["👪 Child progress", "📅 Schedule sessions", "📈 Growth insights"]}
              ctaText="Parent Dashboard"
              href="/signup?type=guardian"
            />
          </div>
        </div>
      </section>

      {/* Keep your existing features grid but enhance it */}
      <section className="py-16 bg-gray-50">
        {/* Your existing features but with more detail */}
      </section>
    </div>
  );
}

  const userType = (user as any)?.userType || 'child';

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
      >
        <SlidersHorizontal className="w-6 h-6 text-foreground" aria-hidden="true" />
      </button>
    </div>
  </header>
      {/* Welcome Section */}
      <div className="py-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {(user as any)?.firstName || 'there'}! 👋
        </h1>
        <p className="text-muted-foreground">
          {userType === 'child' 
            ? "Ready for your speech therapy session today?"
            : userType === 'adult'
            ? "How are you feeling today? I'm here to support you."
            : "Check on your children's progress and schedule new sessions."
          }
        </p>
      </div>

      {/* Content area with scroll */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userType === 'child' && (
            <>
              <Link href="/speech-therapy">
                <Card className="cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Mic className="text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Start Session</h3>
                    <p className="text-sm text-muted-foreground">Begin speech therapy</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/assessment">
                <Card className="cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Target className="text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Assessment</h3>
                    <p className="text-sm text-muted-foreground">Take speech test</p>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}

          {userType === 'adult' && (
            <Link href="/emotional-support">
              <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Brain className="text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Chat Support</h3>
                  <p className="text-sm text-muted-foreground">Talk with AI therapist</p>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/progress-dashboard">
            <Card className="cursor-pointer hover:scale-105 transition-transform">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Progress</h3>
                <p className="text-sm text-muted-foreground">View statistics</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/achievements">
            <Card className="cursor-pointer hover:scale-105 transition-transform">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Achievements</h3>
                <p className="text-sm text-muted-foreground">View rewards</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity & Stats */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Today's Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Practice Sessions</span>
                <Badge variant="outline">0/2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Words Practiced</span>
                <Badge variant="outline">0/20</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy Goal</span>
                <Badge variant="outline">85%+</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>This Week</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sessions</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Accuracy</span>
                <span className="font-semibold text-secondary">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Practice Time</span>
                <span className="font-semibold">45m</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-accent" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Perfect Score!</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">3 Day Streak</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <span>Continue Learning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Pronunciation Practice: Level 2</h3>
                <p className="text-sm text-muted-foreground">Focus on vowel sounds and clarity</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">65% complete</span>
                </div>
              </div>
              <Link href="/speech-therapy">
                <Button>
                  Continue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
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
          className="bg-card text-foreground border border-border rounded-md px-3 py-1 text-sm font-dm-sans focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
          aria-label="Select conversation language"
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
    
  </div>
);
}