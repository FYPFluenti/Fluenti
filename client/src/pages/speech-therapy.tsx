import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThreeAvatar } from "@/components/ui/three-avatar";
import { SpeechExercise } from "@/components/speech/speech-exercise";
import { InitialAssessment } from "@/components/assessment/initial-assessment";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { RoleBasedHeader } from "@/components/navigation/RoleBasedHeader";
import { Link, useLocation } from "wouter";
import { 
  MessageCircle, 
  Users, 
  Home, 
  ArrowLeft, 
  Play, 
  Trophy,
  Target,
  Clock,
  Volume2,
  BookOpen,
  CheckCircle,
  Mic,
  Star,
  Zap,
  Award,
  Sparkles
} from "lucide-react";

interface Exercise {
  id: string;
  type: string;
  difficulty: number;
  word: string;
  phonetic: string;
  sentence: string;
  language: 'english' | 'urdu';
}

interface SessionData {
  id: string;
  exercises: Exercise[];
  currentExerciseIndex: number;
  completedExercises: number;
  totalAccuracy: number;
}

export default function SpeechTherapy() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [isAvatarActive, setIsAvatarActive] = useState(true);
  const [avatarMessage, setAvatarMessage] = useState("Welcome! Let's start your speech therapy session. I'm here to help you improve your pronunciation.");
  const [avatarEmotion, setAvatarEmotion] = useState('encouraging');

  // Create new session mutation - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/speech/session', {
        sessionType: 'exercise'
      });
      return response.json();
    },
    onSuccess: (session) => {
      // Generate sample exercises (in production, these would come from AI)
      const exercises: Exercise[] = [
        {
          id: '1',
          type: 'pronunciation',
          difficulty: 1,
          word: 'HELLO',
          phonetic: '/həˈloʊ/',
          sentence: 'Hello, how are you today?',
          language: 'english'
        },
        {
          id: '2',
          type: 'pronunciation',
          difficulty: 1,
          word: 'WORLD',
          phonetic: '/wɜːrld/',
          sentence: 'Welcome to our world of learning.',
          language: 'english'
        },
        {
          id: '3',
          type: 'pronunciation',
          difficulty: 2,
          word: 'BEAUTIFUL',
          phonetic: '/ˈbjuːtɪfəl/',
          sentence: 'What a beautiful day it is!',
          language: 'english'
        }
      ];

      setCurrentSession({
        id: session.id,
        exercises,
        currentExerciseIndex: 0,
        completedExercises: 0,
        totalAccuracy: 0
      });

      setAvatarMessage("Great! I've prepared some exercises for you. Let's start with the first word.");
      setAvatarEmotion('happy');
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access speech therapy sessions.",
          variant: "destructive",
        });
        // Redirect to frontend login page, not API endpoint
        setTimeout(() => {
          setLocation('/login');
        }, 1000);
        return;
      }
      toast({
        title: "Session Error",
        description: "Failed to start speech therapy session. Please try logging in again.",
        variant: "destructive",
      });
    },
  });

  // Record speech attempt mutation - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const recordSpeechMutation = useMutation({
    mutationFn: async (data: {
      sessionId: string;
      word: string;
      phonetic: string;
      userTranscription: string;
      language: 'english' | 'urdu';
    }) => {
      const response = await apiRequest('POST', '/api/speech/record', data);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/speech/progress'] });
      
      if (result.feedback.accuracy >= 85) {
        setAvatarMessage("Excellent pronunciation! You're doing amazing!");
        setAvatarEmotion('excited');
      } else if (result.feedback.accuracy >= 70) {
        setAvatarMessage("Good job! You're improving with each attempt.");
        setAvatarEmotion('encouraging');
      } else {
        setAvatarMessage("Keep practicing! Remember to speak slowly and clearly.");
        setAvatarEmotion('calm');
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to record speech attempt. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check authentication - useEffect MUST be called before conditional returns
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access speech therapy sessions.",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Handle exercise completion
  const handleExerciseComplete = (result: { accuracy: number; attempts: number }) => {
    if (!currentSession) return;

    const newTotalAccuracy = (currentSession.totalAccuracy * currentSession.completedExercises + result.accuracy) / (currentSession.completedExercises + 1);
    
    setCurrentSession({
      ...currentSession,
      completedExercises: currentSession.completedExercises + 1,
      totalAccuracy: newTotalAccuracy
    });

    // Record the speech attempt
    const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
    recordSpeechMutation.mutate({
      sessionId: currentSession.id,
      word: currentExercise.word,
      phonetic: currentExercise.phonetic,
      userTranscription: currentExercise.word, // In real implementation, this would be the actual transcription
      language: currentExercise.language
    });
  };

  const handleNextExercise = () => {
    if (!currentSession) return;

    if (currentSession.currentExerciseIndex < currentSession.exercises.length - 1) {
      setCurrentSession({
        ...currentSession,
        currentExerciseIndex: currentSession.currentExerciseIndex + 1
      });
      setAvatarMessage("Well done! Let's move on to the next word.");
      setAvatarEmotion('encouraging');
    } else {
      // Session completed
      const finalAccuracy = currentSession.totalAccuracy;
      if (finalAccuracy >= 85) {
        setAvatarMessage("Fantastic work! You've completed the session with excellent results!");
        setAvatarEmotion('excited');
      } else {
        setAvatarMessage("Great effort! Keep practicing and you'll continue to improve.");
        setAvatarEmotion('encouraging');
      }
    }
  };

  const handleAvatarSpeak = () => {
    if (currentSession && avatarMessage) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(avatarMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    }
  };

  // CONDITIONAL RETURNS MUST BE AFTER ALL HOOKS
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-xl font-medium text-blue-600 animate-pulse">Loading your session...</div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">Please log in to access your personalized speech therapy sessions and track your progress.</p>
          <div className="space-y-4">
            <Link href="/login">
              <Button className="fluenti-button-primary w-full text-lg py-6">
                <MessageCircle className="w-5 h-5 mr-2" />
                Go to Login
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full text-lg py-6 border-2 border-gray-300 hover:border-blue-300">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSessionCompleted = currentSession && 
    currentSession.currentExerciseIndex >= currentSession.exercises.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Enhanced Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-300/30 to-purple-300/30 rounded-full fluenti-float shadow-lg"></div>
      <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full fluenti-float shadow-lg" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-300/30 to-blue-300/30 rounded-full fluenti-float shadow-lg" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/3 right-10 w-12 h-12 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full fluenti-float shadow-lg" style={{animationDelay: '3s'}}></div>
      
      {/* Role-based Header */}
      <RoleBasedHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!currentSession ? (
          /* Enhanced Welcome Screen */
          <div className="text-center max-w-5xl mx-auto animate-slide-up">
            <div className="mb-12">
              <UserTypeGuard userType="child">
                <div className="flex justify-center items-center mb-6">
                  <div className="flex space-x-2">
                    <Sparkles className="w-12 h-12 text-purple-500 animate-bounce" />
                    <Star className="w-12 h-12 text-yellow-500 animate-pulse" />
                    <Sparkles className="w-12 h-12 text-pink-500 animate-bounce" style={{animationDelay: '0.5s'}} />
                  </div>
                </div>
                <h1 className="text-6xl font-bold mb-6">
                  <span className="text-gradient-warm">🎮 Speech Games Time! 🎮</span>
                </h1>
                <p className="text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Let's play super fun games while learning to speak like a champion! Your magical AI buddy is here to help you become the best speaker ever! 🌟✨
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="adult">
                <div className="flex justify-center items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold mb-6">
                  <span className="text-gradient-primary">AI-Powered Speech Therapy</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Experience personalized pronunciation training with your AI speech therapist. Get real-time feedback, track your progress, and improve your communication skills with cutting-edge technology.
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="guardian">
                <div className="flex justify-center items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-green-700 mb-6">
                  Professional Speech Therapy Tools
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Access comprehensive therapeutic tools and exercises. Monitor speech development progress with advanced AI insights and support guided therapeutic sessions.
                </p>
              </UserTypeGuard>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              {/* Enhanced Avatar Preview */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <ThreeAvatar />
                  <div className="mt-6 text-center">
                    <UserTypeGuard userType="child">
                      <p className="text-lg font-medium text-purple-600">🤖 Your AI Speech Buddy</p>
                    </UserTypeGuard>
                    <UserTypeGuard userType="adult">
                      <p className="text-lg font-medium text-blue-600">AI Speech Therapist</p>
                    </UserTypeGuard>
                    <UserTypeGuard userType="guardian">
                      <p className="text-lg font-medium text-green-600">Therapeutic AI Assistant</p>
                    </UserTypeGuard>
                  </div>
                </div>
              </div>

              {/* Enhanced Session Info */}
              <div className="space-y-6 text-left">
                <Card className="fluenti-card shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span>Learning Objectives</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                      <span className="font-medium">Crystal-clear pronunciation</span>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                      <span className="font-medium">Perfect phonetic accuracy</span>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-orange-600 rounded-full"></div>
                      <span className="font-medium">Enhanced voice clarity</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="fluenti-card shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span>Session Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-600 font-medium">Duration:</span>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-1">15-20 min</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-600 font-medium">Exercises:</span>
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-1">3 words</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-600 font-medium">Difficulty:</span>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Beginner
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="fluenti-card shadow-xl border-0 bg-gradient-to-br from-white to-yellow-50">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center items-center space-x-2 mb-3">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      <span className="font-bold text-lg text-yellow-700">Rewards System</span>
                    </div>
                    <p className="text-gray-600">
                      Earn stars, unlock achievements, and track your speaking journey!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative">
              <Button
                className="fluenti-button-primary text-2xl px-16 py-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Please Log In First",
                      description: "You need to be logged in to start speech therapy sessions.",
                      variant: "destructive",
                    });
                    setTimeout(() => {
                      setLocation('/login');
                    }, 1500);
                    return;
                  }
                  createSessionMutation.mutate();
                }}
                disabled={createSessionMutation.isPending || !user}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                {createSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <UserTypeGuard userType="child">
                      🎮 Starting Magical Game...
                    </UserTypeGuard>
                    <UserTypeGuard userType="adult">
                      🤖 Initializing AI Session...
                    </UserTypeGuard>
                    <UserTypeGuard userType="guardian">
                      🔧 Loading Professional Tools...
                    </UserTypeGuard>
                  </>
                ) : (
                  <>
                    <UserTypeGuard userType="child">
                      <Zap className="mr-3 w-6 h-6" />
                      🎮 Let's Play & Learn!
                    </UserTypeGuard>
                    <UserTypeGuard userType="adult">
                      <Play className="mr-3 w-6 h-6" />
                      Start AI Speech Therapy
                    </UserTypeGuard>
                    <UserTypeGuard userType="guardian">
                      <BookOpen className="mr-3 w-6 h-6" />
                      Access Therapy Tools
                    </UserTypeGuard>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : isSessionCompleted ? (
          /* Enhanced Session Completed */
          <div className="text-center max-w-5xl mx-auto">
            <div className="mb-12">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                  <Trophy className="text-white text-6xl" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full animate-bounce">
                  <Sparkles className="w-4 h-4 text-white m-2" />
                </div>
              </div>
              
              <UserTypeGuard userType="child">
                <h1 className="text-6xl font-bold text-purple-600 mb-6 animate-bounce">
                  🏆 SUPER AMAZING JOB! 🎉✨
                </h1>
                <p className="text-2xl text-gray-600 leading-relaxed">
                  WOW! You're officially a Speech Champion! You completed all the magical speech games and you're becoming a super duper speaker! 🌟🚀
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="adult">
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  🎯 Session Completed Successfully! 🎉
                </h1>
                <p className="text-xl text-gray-600">
                  Excellent work! You've successfully completed your AI-powered speech therapy session with remarkable progress.
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="guardian">
                <h1 className="text-5xl font-bold text-green-700 mb-6">
                  ✅ Therapeutic Session Complete! 🎯
                </h1>
                <p className="text-xl text-gray-600">
                  Professional speech therapy session completed successfully. Comprehensive progress data and therapeutic insights are now available for review.
                </p>
              </UserTypeGuard>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="fluenti-card text-center shadow-2xl border-0 bg-gradient-to-br from-blue-50 to-blue-100 transform hover:scale-105 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {Math.round(currentSession.totalAccuracy)}%
                  </div>
                  <div className="text-gray-600 font-medium">Overall Accuracy</div>
                  <div className="mt-3">
                    {currentSession.totalAccuracy >= 85 ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Excellent!</Badge>
                    ) : currentSession.totalAccuracy >= 70 ? (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Good!</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Keep Going!</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="fluenti-card text-center shadow-2xl border-0 bg-gradient-to-br from-purple-50 to-purple-100 transform hover:scale-105 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {currentSession.completedExercises}
                  </div>
                  <div className="text-gray-600 font-medium">Words Mastered</div>
                  <div className="mt-3">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">Complete!</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="fluenti-card text-center shadow-2xl border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 transform hover:scale-105 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    +{Math.floor(currentSession.totalAccuracy / 10)}
                  </div>
                  <div className="text-gray-600 font-medium">Stars Earned</div>
                  <div className="mt-3">
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Reward!</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/progress">
                  <Button className="fluenti-button-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <Trophy className="mr-2 w-5 h-5" />
                    View Progress Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentSession(null);
                    setAvatarMessage("Welcome back! Ready for another amazing session?");
                    setAvatarEmotion('encouraging');
                  }}
                  className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Start New Session
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Active Session */
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Avatar Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl p-6 shadow-2xl border border-white/50">
                <ThreeAvatar />
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleAvatarSpeak}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Hear Message
                  </Button>
                </div>
              </div>

              {/* Enhanced Session Progress */}
              <Card className="fluenti-card shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <span>Session Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">Exercise {currentSession.currentExerciseIndex + 1} of {currentSession.exercises.length}</span>
                      <span className="font-medium">{Math.round((currentSession.completedExercises / currentSession.exercises.length) * 100)}% Complete</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(currentSession.completedExercises / currentSession.exercises.length) * 100} 
                        className="h-3 bg-gray-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    
                    {currentSession.completedExercises > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                          <span className="text-gray-600 font-medium">Average Accuracy:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg text-blue-600">
                              {Math.round(currentSession.totalAccuracy)}%
                            </span>
                            {currentSession.totalAccuracy >= 85 && (
                              <Star className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      {currentSession.exercises.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index < currentSession.completedExercises
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : index === currentSession.currentExerciseIndex
                              ? 'bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Exercise Section */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Current Exercise</h2>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-2">
                    Word {currentSession.currentExerciseIndex + 1}
                  </Badge>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
              
              <SpeechExercise
                language={currentSession.exercises[currentSession.currentExerciseIndex].language}
                exerciseType="exercise"
                sessionId={currentSession.id}
                onComplete={(results) => {
                  // Extract accuracy from results and call handleExerciseComplete
                  const accuracy = results.averageAccuracy || 0;
                  const attempts = results.totalAttempts || 1;
                  handleExerciseComplete({ accuracy, attempts });
                  handleNextExercise();
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}