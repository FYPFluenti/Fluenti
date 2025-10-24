import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Star,
  Clock,
  Crown,
  Zap,
  Target,
  Award,
  Sparkles,
  Play,
  CheckCircle,
  Calendar,
  Trophy,
  BookMarked
} from 'lucide-react';

import SharedSidebar from '@/components/layout/SharedSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';
import WordPracticeGame from '@/components/games/WordPracticeGame';

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

  // Main games configuration - Direct game modes without sub-options
  const getGames = () => {
    const baseGames = [
      {
        id: 1,
        title: "Daily Quest",
        description: "Complete today's special word challenges and earn bonus rewards",
        icon: Calendar,
        difficulty: "Easy",
        duration: "10 min",
        xpReward: 50,
        category: "Daily Challenge",
        type: "daily-quest",
        badge: "New Daily!",
        badgeColor: "bg-green-500"
      },
      {
        id: 2,
        title: "Challenge Mode",
        description: "Test your skills with progressively harder word pronunciation challenges",
        icon: Trophy,
        difficulty: "Medium", 
        duration: "15 min",
        xpReward: 75,
        category: "Timed Challenge",
        type: "challenge-mode",
        badge: "Popular",
        badgeColor: "bg-[#ff6b1d]"
      },
      {
        id: 3,
        title: "Story Adventure",
        description: "Practice words through an exciting interactive story journey",
        icon: BookMarked,
        difficulty: "Medium",
        duration: "20 min", 
        xpReward: 100,
        category: "Story Mode",
        type: "story-adventure",
        badge: "Most Fun!",
        badgeColor: "bg-purple-500"
      }
    ];

    // Merge with progress data from backend
    return baseGames.map(game => {
      const progress = gameProgress.find(p => p.gameId === game.id);
      return {
        ...game,
        stars: progress?.stars || 0,
        unlocked: true, // All games unlocked
        level: progress?.level || 1,
        bestScore: progress?.bestScore || 0,
        averageAccuracy: progress?.averageAccuracy || 0,
        completedToday: progress?.completedToday || false
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

  // Direct game start - no sub-options needed
  const startGame = async (game: any) => {
    console.log('🎮 Starting game directly:', {
      gameType: game.type,
      title: game.title,
      gameId: game.id
    });

    if (!game.unlocked) {
      toast({
        title: "Game Locked",
        description: `Complete more challenges to unlock this!`,
        variant: "default",
      });
      return;
    }

    try {
      // Check server connection first
      try {
        const healthCheck = await fetch('/api/health', {
          credentials: 'include',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!healthCheck.ok) {
          throw new Error('Server not responding');
        }
      } catch (healthError) {
        toast({
          title: "Server Connection Lost",
          description: "The server is not responding. Please check if the server is running (npm run dev in terminal).",
          variant: "destructive",
          duration: 10000
        });
        return;
      }

      // Fetch word practice game data (all modes use this as base)
      const gameDataRes = await fetch(`/api/games/game-data/1`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!gameDataRes.ok) {
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

      // Customize game data based on game type
      let customizedGameData = { ...fetchedGameData };
      
      switch (game.type) {
        case 'daily-quest':
          // Daily quest: Select specific daily words
          customizedGameData = {
            ...fetchedGameData,
            title: 'Daily Quest',
            description: 'Complete today\'s word challenge!',
            timeLimit: 600, // 10 minutes
            bonusXP: 25,
            isDailyQuest: true,
            skipSubModes: true,
            directStart: true,
            selectedMode: { type: 'daily-quest', name: 'Daily Quest' }
          };
          break;
          
        case 'challenge-mode':
          // Challenge mode: Harder difficulty with timer
          customizedGameData = {
            ...fetchedGameData,
            title: 'Challenge Mode',
            description: 'Beat the clock and test your skills!',
            timeLimit: 900, // 15 minutes
            difficulty: 'hard',
            scoreMultiplier: 1.5,
            isChallengeMode: true,
            skipSubModes: true,
            directStart: true,
            selectedMode: { type: 'challenge-mode', name: 'Challenge Mode' }
          };
          break;
          
        case 'story-adventure':
          // Story adventure: Story-based word practice
          customizedGameData = {
            ...fetchedGameData,
            title: 'Story Adventure',
            description: 'Help the characters by pronouncing words correctly!',
            storyMode: true,
            chapters: 3,
            isStoryMode: true,
            skipSubModes: true,
            directStart: true,
            selectedMode: { type: 'story-adventure', name: 'Story Adventure' }
          };
          break;
      }

      console.log('🎮 Game data customized:', {
        gameType: game.type,
        title: customizedGameData.title,
        skipSubModes: customizedGameData.skipSubModes,
        directStart: customizedGameData.directStart,
        selectedMode: customizedGameData.selectedMode
      });

      // Create game session
      const sessionRes = await fetch('/api/games/session/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId: game.id,
          gameName: game.title,
          gameType: game.type
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to create game session');
      }

      const session = await sessionRes.json();

      // Set game state and start
      setGameData(customizedGameData);
      setGameSession(session);
      setActiveGame(game);

      console.log('✅ Game state set:', {
        gameData: customizedGameData,
        sessionId: session._id,
        activeGame: game.title
      });

      toast({
        title: "Game Started!",
        description: `Beginning ${game.title}. Good luck!`,
      });

    } catch (error) {
      console.error('Error starting game:', error);
      
      let errorTitle = "Error";
      let errorMessage = "Failed to start game. Please try again.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorTitle = "Connection Failed";
        errorMessage = "Cannot connect to server. Make sure the server is running:\n1. Open terminal\n2. Run: npm run dev\n3. Try again";
      } else if (error instanceof Error) {
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
          errorTitle = "Request Timeout";
          errorMessage = "Server took too long to respond. Please try again.";
        } else if (error.message.includes('Server not responding')) {
          errorTitle = "Server Down";
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
    console.log('Game completed with results:', results);
    
    // Calculate rewards based on game results
    const earnedXP = Math.floor(results.score || 0);
    const earnedStars = results.stars || 0;
    
    // Update user stats with rewards
    setUserStats(prev => {
      if (!prev) {
        console.warn('Previous user stats is undefined, using default values');
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
      title: "Great Job!",
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
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedSidebar 
          onFeedbackOpen={() => setShowFeedback(true)}
          currentPage="games"
        />
      </div>

      {/* Main Content */}
      <main className="lg:ml-20 p-4 lg:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <PageHeader className="flex justify-end items-center mb-4 sm:mb-6 -mt-1 sm:-mt-2" />

        {!activeGame ? (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Hi {childName || ((user && 'firstName' in user) ? user.firstName : 'there')}! Ready to practice?
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Choose a game to improve your speech skills
                  </p>
                </div>
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

            {/* Main Games Grid */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#ff6b1d]" />
                Choose Your Adventure
              </h2>
              <p className="text-muted-foreground mb-6">
                Each game offers unique word practice challenges
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: game.id * 0.1 }}
                  className={`bg-card border border-border rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg relative ${
                    !game.unlocked ? 'opacity-60' : ''
                  }`}
                  onClick={() => startGame(game)}
                >
                  {/* Badge */}
                  {game.badge && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`${game.badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                        {game.badge}
                      </span>
                    </div>
                  )}

                  {/* Game Header */}
                  <div className="bg-gradient-to-br from-muted to-muted/50 p-6 relative">
                    {!game.unlocked && (
                      <div className="absolute top-2 left-2 bg-card rounded-full p-1.5 border border-border">
                        <Crown className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    {game.completedToday && (
                      <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1.5">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-[#ff6b1d]/10 flex items-center justify-center border-2 border-[#ff6b1d]/20">
                        <game.icon className="w-10 h-10 text-[#ff6b1d]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">{game.title}</h3>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Game Details */}
                  <div className="p-5 space-y-4">
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
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
                      <span className="inline-block bg-muted px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground">
                        {game.category}
                      </span>
                    </div>

                    {game.unlocked ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click from firing
                          console.log('🎮 Button clicked for game:', game.title, game.type);
                          startGame(game);
                        }}
                        className="w-full bg-[#ff6b1d] hover:bg-[#e55a1a] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <Play className="w-4 h-4" />
                        Start {game.title}
                      </button>
                    ) : (
                      <button disabled className="w-full bg-muted text-muted-foreground font-medium py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        Level {Math.ceil(game.id * 2)} Required
                      </button>
                    )}

                    {game.bestScore > 0 && (
                      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
                        Best Score: <span className="font-bold text-[#ff6b1d]">{game.bestScore}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ff6b1d]" />
                About Game Modes
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Daily Quest:</span> Fresh word challenges every day with bonus rewards!
                </div>
                <div>
                  <span className="font-semibold text-foreground">Challenge Mode:</span> Race against time with harder words for bigger rewards!
                </div>
                <div>
                  <span className="font-semibold text-foreground">Story Adventure:</span> Learn words through fun interactive stories!
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Active Game - Directly launches the specific game */
          <div>
            {activeGame && gameSession && gameData && (
              <WordPracticeGame
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="games"
        userType="child"
      />
    </div>
  );
}