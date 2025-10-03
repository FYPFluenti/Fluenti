import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { 
  Gamepad2, 
  LineChart, 
  Smile, 
  User, 
  Settings,
  Trophy,
  Star,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Zap,
  Target,
  Award,
  Sparkles
} from 'lucide-react';

// Your components imports - fixed paths
import FluentiLogo from '@/components/FluentiLogo';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function SpeechTherapyPage() {
  const { toast } = useToast();
  const [hovered, setHovered] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [userStats, setUserStats] = useState({
    level: 12,
    xp: 2450,
    stars: 156,
    streak: 7
  });

  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const setLocation = (path: string) => {
    // Your navigation logic here
    window.location.href = path;
  };

    // Feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
    toast({
      title: "Feedback submitted!",
      description: "Thank you for helping us make Fluenti better!",
    });
  };

  const games = [
    {
      id: 1,
      title: "Phonics Adventure Quest",
      description: "Embark on a magical journey through the kingdom of sounds!",
      emoji: "🏰",
      difficulty: "Easy",
      duration: "15 min",
      stars: 3,
      xpReward: 50,
      color: "from-purple-400 to-pink-500",
      unlocked: true,
      category: "Phonics"
    },
    {
      id: 2,
      title: "Word Building Workshop",
      description: "Construct amazing words with your syllable toolkit!",
      emoji: "🔧",
      difficulty: "Medium", 
      duration: "20 min",
      stars: 2,
      xpReward: 75,
      color: "from-blue-400 to-cyan-500",
      unlocked: true,
      category: "Vocabulary"
    },
    {
      id: 3,
      title: "Rhythm & Rhyme Studio",
      description: "Create beautiful music with speech patterns and beats!",
      emoji: "🎵",
      difficulty: "Medium",
      duration: "18 min", 
      stars: 3,
      xpReward: 80,
      color: "from-green-400 to-teal-500",
      unlocked: true,
      category: "Rhythm"
    },
    {
      id: 4,
      title: "Articulation Arcade",
      description: "Master pronunciation in this exciting arcade adventure!",
      emoji: "🕹️",
      difficulty: "Hard",
      duration: "25 min",
      stars: 1,
      xpReward: 100,
      color: "from-orange-400 to-red-500", 
      unlocked: userStats.level >= 10,
      category: "Articulation"
    },
    {
      id: 5,
      title: "Story Theater",
      description: "Become the star of your own interactive storytelling show!",
      emoji: "🎭",
      difficulty: "Hard",
      duration: "30 min",
      stars: 0,
      xpReward: 120,
      color: "from-indigo-400 to-purple-600",
      unlocked: userStats.level >= 15,
      category: "Storytelling"
    },
    {
      id: 6,
      title: "Sound Safari Explorer",
      description: "Discover amazing animals and practice their sounds!",
      emoji: "🦁",
      difficulty: "Easy",
      duration: "12 min",
      stars: 3,
      xpReward: 45,
      color: "from-yellow-400 to-orange-500",
      unlocked: true,
      category: "Animal Sounds"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100'; 
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const startGame = (game: any) => {
    if (!game.unlocked) return;
    setSelectedGame(game);
    setGameInProgress(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Your Sidebar */}
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
      <main className="ml-20 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Speech Adventure Center 🎮
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your next gaming adventure and level up your speech skills!
              </p>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl transition-all ${
                soundEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <p className="text-purple-100 text-sm">Current Level</p>
                  <p className="text-2xl font-bold">{userStats.level}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8" />
                <div>
                  <p className="text-orange-100 text-sm">Experience Points</p>
                  <p className="text-2xl font-bold">{userStats.xp.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8" />
                <div>
                  <p className="text-yellow-100 text-sm">Stars Collected</p>
                  <p className="text-2xl font-bold">{userStats.stars}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8" />
                <div>
                  <p className="text-green-100 text-sm">Daily Streak</p>
                  <p className="text-2xl font-bold">{userStats.streak} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: game.id * 0.1 }}
              className={`relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                game.unlocked 
                  ? 'hover:shadow-2xl' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => startGame(game)}
            >
              {/* Game Card Background */}
              <div className={`bg-gradient-to-br ${game.color} p-6 text-white relative`}>
                {/* Lock Overlay for Locked Games */}
                {!game.unlocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
                      <p className="text-sm font-medium">Unlock at Level {game.id * 3}</p>
                    </div>
                  </div>
                )}

                {/* Game Emoji */}
                <div className="text-6xl mb-4 text-center">{game.emoji}</div>

                {/* Game Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-center">{game.title}</h3>
                  <p className="text-sm opacity-90 text-center leading-relaxed">
                    {game.description}
                  </p>

                  {/* Game Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{game.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>+{game.xpReward} XP</span>
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </span>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < game.stars 
                              ? 'text-yellow-300 fill-yellow-300' 
                              : 'text-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Category Tag */}
                  <div className="text-center">
                    <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                      {game.category}
                    </span>
                  </div>

                  {/* Play Button */}
                  {game.unlocked && (
                    <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group">
                      <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Start Adventure
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Achievement Celebration */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-2xl text-white text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Award className="w-12 h-12 text-yellow-300" />
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Keep Up the Amazing Work! 🌟</h2>
          <p className="text-purple-100 mb-4">
            You're on a {userStats.streak}-day streak! Complete one more game today to keep it going!
          </p>
          <div className="bg-white/20 rounded-full h-3 mb-4">
            <div 
              className="bg-yellow-300 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(userStats.xp % 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-purple-100">
            {100 - (userStats.xp % 100)} XP until next level!
          </p>
        </motion.div>
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