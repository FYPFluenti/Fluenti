import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Star,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Crown,
  Zap,
  Target,
  Award,
  Sparkles,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Headphones,
  MessageSquare,
  Ear,
  Construction,
  Music,
  BookOpen,
  Bolt,
  Cat,
  Dog,
  Home,
  Bug,
  Hand
} from 'lucide-react';

import SharedSidebar from '@/components/layout/SharedSidebar';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';
import WordPracticeGame from '@/components/games/WordPracticeGame';
import SoundRecognitionGame from '@/components/games/SoundRecognitionGame';
import SentenceBuildingGame from '@/components/games/SentenceBuildingGame';
import RhythmTrainingGame from '@/components/games/RhythmTrainingGame';
import StoryReadingGame from '@/components/games/StoryReadingGame';
import QuickSoundsGame from '@/components/games/QuickSoundsGame';

interface GameSession {
  _id: string;
  gameId: number;
  gameName: string;
  startTime: Date;
  score: number;
  accuracy: number;
  completed: boolean;
}

export default function SpeechTherapyPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth() as { user: { firstName?: string; lastName?: string }; isAuthenticated: boolean };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameProgress, setGameProgress] = useState<any[]>([]);

  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    stars: 0,
    streak: 0,
    todaysSessions: 0,
    dailyGoal: 3,
    averageAccuracy: 0
  });

  // Games configuration
  const getGames = () => {
    const baseGames = [
      {
        id: 1,
        title: "Word Practice",
        description: "Practice pronouncing common words clearly and correctly",
        icon: MessageSquare,
        difficulty: "Easy",
        duration: "10 min",
        xpReward: 25,
        category: "Pronunciation",
        type: "word-practice"
      },
      {
        id: 2,
        title: "Sound Recognition",
        description: "Listen and identify different speech sounds",
        icon: Ear,
        difficulty: "Easy", 
        duration: "8 min",
        xpReward: 20,
        category: "Listening",
        type: "sound-recognition"
      },
      {
        id: 3,
        title: "Sentence Building",
        description: "Create complete sentences with proper pronunciation",
        icon: Construction,
        difficulty: "Medium",
        duration: "15 min", 
        xpReward: 40,
        category: "Grammar",
        type: "sentence-building"
      },
      {
        id: 4,
        title: "Rhythm Training",
        description: "Practice speech rhythm and timing patterns",
        icon: Music,
        difficulty: "Medium",
        duration: "12 min",
        xpReward: 35,
        category: "Fluency",
        type: "rhythm-training"
      },
      {
        id: 5,
        title: "Story Reading",
        description: "Read short stories with proper expression and clarity",
        icon: BookOpen,
        difficulty: "Hard",
        duration: "20 min",
        xpReward: 60,
        category: "Reading",
        type: "story-reading"
      },
      {
        id: 6,
        title: "Quick Sounds",
        description: "Fast-paced pronunciation challenges for confident speakers",
        icon: Bolt,
        difficulty: "Hard",
        duration: "18 min",
        xpReward: 50,
        category: "Speed",
        type: "quick-sounds"
      }
    ];

    // Merge with progress data from backend
    return baseGames.map(game => {
      const progress = gameProgress.find(p => p.gameId === game.id);
      return {
        ...game,
        stars: progress?.stars || 0,

        //lock the game later on 
        unlocked: true, // TEMPORARILY UNLOCK ALL GAMES
        level: progress?.level || 1,
        bestScore: progress?.bestScore || 0,
        averageAccuracy: progress?.averageAccuracy || 0
      };
    });
  };

  const games = getGames();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);

        // Fetch child name, statistics, and game progress in parallel
        // No need for Authorization header - cookies are sent automatically
        const [onboardingRes, statsRes, progressRes] = await Promise.all([
          fetch('/api/onboarding', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/games/statistics', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/games/progress', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        ]);

        // Handle onboarding data
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json();
          if (onboardingData?.childName) {
            setChildName(onboardingData.childName);
          }
        }

        // Handle statistics
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setUserStats({
            level: stats.level || 1,
            xp: stats.xp || 0,
            stars: stats.stars || 0,
            streak: stats.streak || 0,
            todaysSessions: stats.recentSessions?.filter((s: any) => {
              const today = new Date().toDateString();
              return new Date(s.createdAt).toDateString() === today;
            }).length || 0,
            dailyGoal: 3,
            averageAccuracy: stats.averageAccuracy || 0
          });
        }

        // Handle game progress
        if (progressRes.ok) {
          const progress = await progressRes.json();
          setGameProgress(progress);
        }

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load game data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, toast]);

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'text-[#ff6b1d] bg-[#ff6b1d]/10 dark:bg-[#ff6b1d]/20';
      case 'Medium': return 'text-muted-foreground bg-muted'; 
      case 'Hard': return 'text-foreground bg-accent/50 dark:bg-accent';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const startGame = async (game: any) => {
    if (!game.unlocked) {
      toast({
        title: "Game Locked",
        description: `Complete more games to unlock this!`,
        variant: "default",
      });
      return;
    }

    try {
      // ✅ Check server connection first
      try {
        const healthCheck = await fetch('/api/health', {
          credentials: 'include',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!healthCheck.ok) {
          throw new Error('Server not responding');
        }
      } catch (healthError) {
        toast({
          title: "🔌 Server Connection Lost",
          description: "The server is not responding. Please check if the server is running (npm run dev in terminal).",
          variant: "destructive",
          duration: 10000
        });
        return;
      }

      // Fetch game-specific data (cookies sent automatically)
      const gameDataRes = await fetch(`/api/games/game-data/${game.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!gameDataRes.ok) {
        // ✅ Specific error messages
        if (gameDataRes.status === 401) {
          throw new Error('Please log in again to continue.');
        } else if (gameDataRes.status === 404) {
          throw new Error('This game is not available yet.');
        } else if (gameDataRes.status >= 500) {
          throw new Error('Server error. Please try again in a moment.');
        }
        throw new Error('Failed to fetch game data');
      }

      const fetchedGameData = await gameDataRes.json();

      // Create game session
      const sessionRes = await fetch('/api/games/session/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId: game.id,
          gameName: game.title
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to create game session');
      }

      const session = await sessionRes.json();

      setGameData(fetchedGameData);
      setGameSession(session);
      setActiveGame(game);

      toast({
        title: "Game Started!",
        description: `Beginning ${game.title}. Good luck!`,
      });

    } catch (error) {
      console.error('Error starting game:', error);
      
      // ✅ Specific error messages based on error type
      let errorTitle = "Error";
      let errorMessage = "Failed to start game. Please try again.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorTitle = "🔌 Connection Failed";
        errorMessage = "Cannot connect to server. Make sure the server is running:\n1. Open terminal\n2. Run: npm run dev\n3. Try again";
      } else if (error instanceof Error) {
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
          errorTitle = "⏱️ Request Timeout";
          errorMessage = "Server took too long to respond. Please try again.";
        } else if (error.message.includes('Server not responding')) {
          errorTitle = "🔌 Server Down";
          errorMessage = "The server is not running. Please start it with 'npm run dev' in terminal.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 10000
      });
    }
  };

  const handleGameComplete = async (results: any) => {
    console.log('🎮 Game completed with results:', results);
    
    // Calculate rewards based on game results
    const earnedXP = Math.floor(results.score || 0);
    const earnedStars = results.stars || 0;
    
    // Update user stats with rewards
    setUserStats(prev => {
      // Safety check to ensure prev exists
      if (!prev) {
        console.warn('⚠️ Previous user stats is undefined, using default values');
        prev = {
          level: 1,
          xp: 0,
          stars: 0,
          streak: 0,
          todaysSessions: 0,
          dailyGoal: 3,
          averageAccuracy: 0
        };
      }
      
      return {
        ...prev,
        xp: (prev.xp || 0) + earnedXP,
        stars: (prev.stars || 0) + earnedStars,
        todaysSessions: (prev.todaysSessions || 0) + 1,
        level: Math.floor(((prev.xp || 0) + earnedXP) / 100) + 1
      };
    });

    // Show completion toast
    toast({
      title: "🎉 Great Job!",
      description: `You earned ${earnedXP} XP and ${earnedStars} stars!`,
    });

    // Reset game state
    setActiveGame(null);
    setGameSession(null);
    setGameData(null);

    // Refresh progress data
    try {
      const progressRes = await fetch('/api/games/progress', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (progressRes.ok) {
        const progress = await progressRes.json();
        setGameProgress(progress);
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  };

  const handleGameExit = () => {
    setActiveGame(null);
    setGameSession(null);
    setGameData(null);
  };

  // Today's goal progress
  const dailyProgress = Math.min((userStats.todaysSessions / userStats.dailyGoal) * 100, 100);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center child-dashboard-no-zoom">
        <div className="text-center child-dashboard-container px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to access speech games.</p>
          <button
            onClick={() => setLocation('/login')}
            className="bg-[#ff6b1d] text-white px-6 py-2 rounded-lg hover:bg-[#e55a1a] child-dashboard-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background child-dashboard-no-zoom">
        <SharedSidebar currentPage="games" />
        <main className="ml-20 p-4 sm:p-6 child-dashboard-container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background child-dashboard-no-zoom">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="games"
      />

      {/* Main Content */}
      <main className="ml-20 p-4 sm:p-6 child-dashboard-container">
        {/* Header */}
        <PageHeader className="flex justify-end items-center mb-4 sm:mb-6 -mt-1 sm:-mt-2" />

        {!activeGame ? (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Hand className="w-8 h-8 text-[#F5B82E]" />
                    Hi {childName || ((user && 'firstName' in user) ? user.firstName : 'there')}! Ready to practice?
                    <Target className="w-7 h-7 text-[#F5B82E]" />
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Choose a game to improve your speech skills
                  </p>
                </div>

                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-3 rounded-xl transition-all ${
                    soundEnabled 
                      ? 'bg-[#ff6b1d]/10 text-[#ff6b1d] hover:bg-[#ff6b1d]/20 dark:bg-[#ff6b1d]/20' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </div>

              {/* Daily Progress */}
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#ff6b1d]" />
                    Today's Goal
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {userStats.todaysSessions}/{userStats.dailyGoal} sessions
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div 
                    className="bg-[#ff6b1d] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {dailyProgress >= 100 ? (
                    <>
                      <span>Daily goal completed!</span>
                      <Award className="w-4 h-4 text-[#ff6b1d]" />
                    </>
                  ) : (
                    `${Math.round(dailyProgress)}% complete`
                  )}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Crown className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.level}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Star className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.stars}</div>
                  <div className="text-xs text-muted-foreground">Stars</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.xp}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <Target className="w-6 h-6 mx-auto mb-2 text-[#ff6b1d]" />
                  <div className="text-xl font-bold">{userStats.streak}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
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
                  className={`bg-card border border-border rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    !game.unlocked ? 'opacity-60' : ''
                  }`}
                  onClick={() => startGame(game)}
                >
                  {/* Game Header */}
                  <div className="bg-muted p-6 relative">
                    {!game.unlocked && (
                      <div className="absolute top-2 right-2 bg-card rounded-full p-1.5 border border-border">
                        <Crown className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex justify-center mb-3">
                      <div className="w-16 h-16 rounded-xl bg-[#ff6b1d]/10 flex items-center justify-center">
                        <game.icon className="w-8 h-8 text-[#ff6b1d]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-center mb-2">{game.title}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {game.description}
                    </p>
                  </div>

                  {/* Game Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{game.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#ff6b1d]">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">+{game.xpReward} XP</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < game.stars 
                                ? 'text-[#ff6b1d] fill-[#ff6b1d]' 
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                        {game.category}
                      </span>
                    </div>

                    {game.unlocked ? (
                      <button className="w-full bg-[#ff6b1d] hover:bg-[#e55a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        Start Game
                      </button>
                    ) : (
                      <button disabled className="w-full bg-muted text-muted-foreground font-medium py-2.5 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        Level {Math.ceil(game.id * 1.5)} Required
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          /* Active Game Interface */
          <div>
            {activeGame.type === 'word-practice' && gameSession && gameData && (
              <WordPracticeGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
            
            {activeGame.type === 'sound-recognition' && gameSession && gameData && (
              <SoundRecognitionGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
            
            {activeGame.type === 'sentence-building' && gameSession && gameData && (
              <SentenceBuildingGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
            
            {activeGame.type === 'rhythm-training' && gameSession && gameData && (
              <RhythmTrainingGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
            
            {activeGame.type === 'story-reading' && gameSession && gameData && (
              <StoryReadingGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
            
            {activeGame.type === 'quick-sounds' && gameSession && gameData && (
              <QuickSoundsGame
                gameData={gameData}
                sessionId={gameSession._id}
                onComplete={handleGameComplete}
                onExit={handleGameExit}
              />
            )}
          </div>
        )}
      </main>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}