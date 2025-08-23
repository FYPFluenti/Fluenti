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
  Smile
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Add these new state variables
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Add feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
  };

  
  // If not authenticated, show landing page
if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Landing Page Header */}
      <header className="bg-white/80 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-primary">Fluenti</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Landing Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary">Fluenti</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your AI-powered speech therapy companion. Improve your communication skills 
            with personalized exercises, real-time feedback, and emotional support.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mic className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Speech Therapy</h3>
            <p className="text-gray-600">
              Interactive exercises designed to improve pronunciation and clarity
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <Brain className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Support</h3>
            <p className="text-gray-600">
              24/7 emotional support and guidance from our AI therapist
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
            <p className="text-gray-600">
              Monitor your improvement with detailed analytics and insights
            </p>
          </Card>
        </div>
      </main>
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
        { icon: LineChart, label: "progress", id: "progress", path: "/progress" },
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
    <main className="ml-20 px-6 w-full h-screen overflow-hidden flex flex-col">
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

          <Link href="/progress">
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