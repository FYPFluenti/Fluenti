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
  Volume,
  FileText,
  Music,
  BookOpen,
  Bolt,
  Cat,
  Dog,
  Home,
  Flower2
} from 'lucide-react';

import SharedSidebar from '@/components/layout/SharedSidebar';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';

interface GameSession {
  gameId: number;
  startTime: Date;
  currentLevel: number;
  score: number;
  wordsCompleted: string[];
  accuracy: number;
}

export default function SpeechTherapyPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth() as { user: { firstName?: string; lastName?: string }; isAuthenticated: boolean };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [practiceWords] = useState([
    { word: 'CAT', phonetic: '/kæt/', difficulty: 1, icon: Cat },
    { word: 'DOG', phonetic: '/dɔːg/', difficulty: 1, icon: Dog },
    { word: 'HOUSE', phonetic: '/haʊs/', difficulty: 2, icon: Home },
    { word: 'BUTTERFLY', phonetic: '/ˈbʌtərflaɪ/', difficulty: 3, icon: Flower2 }
  ]);

  const [userStats, setUserStats] = useState({
    level: 5,
    xp: 1250,
    stars: 89,
    streak: 3,
    todaysSessions: 1,
    dailyGoal: 3
  });

  const games = [
    {
      id: 1,
      title: "Word Practice",
      description: "Practice pronouncing common words clearly and correctly",
      icon: MessageSquare,
      iconColor: "text-blue-500",
      difficulty: "Easy",
      duration: "10 min",
      stars: userStats.level >= 1 ? 3 : 0,
      xpReward: 25,
      unlocked: true,
      category: "Pronunciation",
      type: "interactive"
    },
    {
      id: 2,
      title: "Sound Recognition",
      description: "Listen and identify different speech sounds",
      icon: Volume,
      iconColor: "text-green-500",
      difficulty: "Easy", 
      duration: "8 min",
      stars: userStats.level >= 2 ? 2 : 0,
      xpReward: 20,
      unlocked: true,
      category: "Listening",
      type: "interactive"
    },
    {
      id: 3,
      title: "Sentence Building",
      description: "Create complete sentences with proper pronunciation",
      icon: FileText,
      iconColor: "text-purple-500",
      difficulty: "Medium",
      duration: "15 min", 
      stars: userStats.level >= 3 ? 1 : 0,
      xpReward: 40,
      unlocked: userStats.level >= 3,
      category: "Grammar",
      type: "interactive"
    },
    {
      id: 4,
      title: "Rhythm Training",
      description: "Practice speech rhythm and timing patterns",
      icon: Music,
      iconColor: "text-pink-500",
      difficulty: "Medium",
      duration: "12 min",
      stars: userStats.level >= 4 ? 2 : 0,
      xpReward: 35,
      unlocked: userStats.level >= 4,
      category: "Fluency",
      type: "browser-game"
    },
    {
      id: 5,
      title: "Story Reading",
      description: "Read short stories with proper expression and clarity",
      icon: BookOpen,
      iconColor: "text-indigo-500",
      difficulty: "Hard",
      duration: "20 min",
      stars: 0,
      xpReward: 60,
      unlocked: userStats.level >= 8,
      category: "Reading",
      type: "api-game"
    },
    {
      id: 6,
      title: "Quick Sounds",
      description: "Fast-paced pronunciation challenges for confident speakers",
      icon: Bolt,
      iconColor: "text-yellow-500",
      difficulty: "Hard",
      duration: "18 min",
      stars: 0,
      xpReward: 50,
      unlocked: userStats.level >= 6,
      category: "Speed",
      type: "interactive"
    }
  ];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'text-[#ff6b1d] bg-[#ff6b1d]/10 dark:bg-[#ff6b1d]/20';
      case 'Medium': return 'text-muted-foreground bg-muted'; 
      case 'Hard': return 'text-foreground bg-accent/50 dark:bg-accent';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const startGame = (game: any) => {
    if (!game.unlocked) {
      toast({
        title: "Game Locked",
        description: `Reach level ${Math.ceil(game.id * 1.5)} to unlock this game!`,
        variant: "default",
      });
      return;
    }

    // Initialize game session
    const session: GameSession = {
      gameId: game.id,
      startTime: new Date(),
      currentLevel: 1,
      score: 0,
      wordsCompleted: [],
      accuracy: 0
    };

    setActiveGame(game);
    setGameSession(session);

    if (game.type === 'interactive') {
      // Start interactive session
      setCurrentWord(practiceWords[0].word);
    } else if (game.type === 'browser-game') {
      // Load browser game (will implement below)
      loadBrowserGame(game.id);
    } else if (game.type === 'api-game') {
      // Load API game (will implement below)
      loadAPIGame(game.id);
    }

    toast({
      title: "Game Started!",
      description: `Beginning ${game.title}. Good luck!`,
    });
  };

  const endGame = () => {
    if (gameSession) {
      const finalScore = gameSession.score;
      const accuracy = gameSession.accuracy;
      
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        xp: prev.xp + (activeGame?.xpReward || 0),
        stars: prev.stars + Math.floor(accuracy / 30),
        todaysSessions: prev.todaysSessions + 1
      }));

      toast({
        title: "Great Job!",
        description: `Session completed! Score: ${finalScore}, Accuracy: ${accuracy}%`,
      });
    }

    setActiveGame(null);
    setGameSession(null);
    setCurrentWord('');
    setIsListening(false);
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false);
        const accuracy = Math.random() * 40 + 60; // 60-100% accuracy
        
        if (gameSession) {
          setGameSession({
            ...gameSession,
            score: gameSession.score + Math.round(accuracy),
            wordsCompleted: [...gameSession.wordsCompleted, currentWord],
            accuracy: (gameSession.accuracy + accuracy) / 2
          });
        }

        if (accuracy > 80) {
          toast({
            title: "Excellent!",
            description: "Perfect pronunciation!",
          });
        } else {
          toast({
            title: "Good try!",
            description: "Keep practicing, you're improving!",
          });
        }

        // Move to next word
        const currentIndex = practiceWords.findIndex(w => w.word === currentWord);
        if (currentIndex < practiceWords.length - 1) {
          setCurrentWord(practiceWords[currentIndex + 1].word);
        } else {
          endGame();
        }
      }, 2000);
    }
  };

  // Today's goal progress
  const dailyProgress = Math.min((userStats.todaysSessions / userStats.dailyGoal) * 100, 100);

  // Placeholder functions for game integration (will implement below)
  const loadBrowserGame = (gameId: number) => {
    console.log(`Loading browser game ${gameId}`);
  };

  const loadAPIGame = (gameId: number) => {
    console.log(`Loading API game ${gameId}`);
  };

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
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Hi {(user && 'firstName' in user) ? user.firstName : 'there'}! Ready to practice?
                    </h1>
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff6b1d]" />
                  </div>
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
                    
                    <div className="mb-3 text-center">
                      <game.icon className={`w-12 h-12 mx-auto ${game.iconColor}`} />
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
          <div className="max-w-4xl mx-auto">
            {/* Game Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={endGame}
                  className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">{activeGame.title}</h1>
                  <p className="text-muted-foreground">Score: {gameSession?.score || 0} points</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-lg font-semibold">
                  {gameSession?.wordsCompleted.length || 0}/{practiceWords.length}
                </div>
              </div>
            </div>

            {/* Game Content */}
            {activeGame.type === 'interactive' && (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="mb-8">
                  <div className="mb-4 flex justify-center">
                    {(() => {
                      const currentPracticeWord = practiceWords.find((w: any) => w.word === currentWord);
                      const IconComponent = currentPracticeWord?.icon || MessageSquare;
                      return <IconComponent className="w-20 h-20 text-[#ff6b1d]" />;
                    })()}
                  </div>
                  <h2 className="text-4xl font-bold mb-2">{currentWord}</h2>
                  <p className="text-xl text-muted-foreground mb-6">
                    {practiceWords.find((w: any) => w.word === currentWord)?.phonetic}
                  </p>
                  
                  <div className="space-y-4 max-w-md mx-auto">
                    <button
                      onClick={() => {
                        if (soundEnabled && 'speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(currentWord);
                          utterance.rate = 0.8;
                          speechSynthesis.speak(utterance);
                        }
                      }}
                      className="w-full bg-muted hover:bg-muted/80 text-foreground py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Headphones className="w-5 h-5" />
                      Listen to Word
                    </button>
                    
                    <button
                      onClick={handleVoiceInput}
                      disabled={isListening}
                      className={`w-full py-4 px-6 rounded-lg flex items-center justify-center gap-2 text-lg font-semibold transition-all ${
                        isListening 
                          ? 'bg-[#ff6b1d]/90 text-white animate-pulse' 
                          : 'bg-[#ff6b1d] hover:bg-[#e55a1a] text-white'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-6 h-6" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="w-6 h-6" />
                          Say the Word
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
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