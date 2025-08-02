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
  Mic
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
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const isSessionCompleted = currentSession && 
    currentSession.currentExerciseIndex >= currentSession.exercises.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-blue-300/20 rounded-full fluenti-float"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-purple-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-pink-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      {/* Role-based Header */}
      <RoleBasedHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">{!currentSession ? (
          /* Welcome Screen */
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            <div className="mb-8">
              <UserTypeGuard userType="child">
                <h1 className="text-5xl font-bold mb-6">
                  <span className="text-gradient-warm">🎮 Speech Games Time! 🎮</span>
                </h1>
                <p className="text-2xl text-gray-600 leading-relaxed">
                  Let's play fun games while learning to speak better! Your AI buddy is here to help you! 🌟
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="adult">
                <h1 className="text-4xl font-bold mb-6">
                  <span className="text-gradient-primary">Speech Therapy Session</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Practice pronunciation with your AI speech therapist. Get real-time feedback and improve your speaking skills.
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="guardian">
                <h1 className="text-4xl font-bold text-green-700 mb-4">
                  Speech Therapy Tools
                </h1>
                <p className="text-xl text-gray-600">
                  Access therapeutic tools and exercises. Monitor and support speech development with AI assistance.
                </p>
              </UserTypeGuard>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Avatar Preview */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8">
                <ThreeAvatar />
              </div>

              {/* Session Info */}
              <div className="space-y-6 text-left">
                <Card className="fluenti-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="text-primary" />
                      <span>What You'll Practice</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Clear pronunciation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span>Phonetic accuracy</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>Voice clarity</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="fluenti-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="text-secondary" />
                      <span>Session Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">15-20 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exercises:</span>
                      <span className="font-medium">3 words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <Badge className="bg-green-100 text-green-700">Beginner</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button
              className="fluenti-button-primary text-xl px-12 py-6"
              onClick={() => {
                if (!user) {
                  toast({
                    title: "Authentication Required",
                    description: "Please log in to start your speech therapy session.",
                    variant: "destructive",
                  });
                  setTimeout(() => {
                    setLocation('/login');
                  }, 1000);
                  return;
                }
                createSessionMutation.mutate();
              }}
              disabled={createSessionMutation.isPending || !user}
            >
              {createSessionMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <UserTypeGuard userType="child">
                    Starting Game...
                  </UserTypeGuard>
                  <UserTypeGuard userType="adult">
                    Starting Session...
                  </UserTypeGuard>
                  <UserTypeGuard userType="guardian">
                    Loading Tools...
                  </UserTypeGuard>
                </>
              ) : (
                <>
                  <Play className="mr-2" />
                  <UserTypeGuard userType="child">
                    🎮 Let's Play!
                  </UserTypeGuard>
                  <UserTypeGuard userType="adult">
                    Start Speech Therapy
                  </UserTypeGuard>
                  <UserTypeGuard userType="guardian">
                    Access Therapy Tools
                  </UserTypeGuard>
                </>
              )}
            </Button>
          </div>
        ) : isSessionCompleted ? (
          /* Session Completed */
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-white text-4xl" />
              </div>
              <UserTypeGuard userType="child">
                <h1 className="text-4xl font-bold text-purple-600 mb-4">
                  🏆 Amazing Job! You Did It! 🎉
                </h1>
                <p className="text-xl text-gray-600">
                  Wow! You completed all the speech games! You're becoming a super speaker! ⭐
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="adult">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Session Completed! 🎉
                </h1>
                <p className="text-xl text-gray-600">
                  Congratulations on completing your speech therapy session!
                </p>
              </UserTypeGuard>

              <UserTypeGuard userType="guardian">
                <h1 className="text-4xl font-bold text-green-700 mb-4">
                  Therapy Session Complete! 🎯
                </h1>
                <p className="text-xl text-gray-600">
                  Speech therapy tools session completed successfully. Review progress and insights below.
                </p>
              </UserTypeGuard>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="fluenti-card text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Math.round(currentSession.totalAccuracy)}%
                  </div>
                  <div className="text-gray-600">Overall Accuracy</div>
                </CardContent>
              </Card>
              <Card className="fluenti-card text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {currentSession.completedExercises}
                  </div>
                  <div className="text-gray-600">Words Practiced</div>
                </CardContent>
              </Card>
              <Card className="fluenti-card text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-accent mb-2">
                    +5
                  </div>
                  <div className="text-gray-600">Points Earned</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Link href="/progress">
                <Button className="fluenti-button-primary mr-4">
                  <Trophy className="mr-2" />
                  View Progress
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentSession(null);
                  setAvatarMessage("Welcome back! Ready for another session?");
                  setAvatarEmotion('encouraging');
                }}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Play className="mr-2" />
                Start New Session
              </Button>
            </div>
          </div>
        ) : (
          /* Active Session */
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Avatar Section */}
            <div>
              <ThreeAvatar />

              {/* Session Progress */}
              <Card className="fluenti-card mt-6">
                <CardHeader>
                  <CardTitle>Session Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Exercise {currentSession.currentExerciseIndex + 1} of {currentSession.exercises.length}</span>
                      <span>{Math.round((currentSession.completedExercises / currentSession.exercises.length) * 100)}% Complete</span>
                    </div>
                    <Progress value={(currentSession.completedExercises / currentSession.exercises.length) * 100} />
                    
                    {currentSession.completedExercises > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Average Accuracy:</span>
                          <span className="font-medium text-secondary">
                            {Math.round(currentSession.totalAccuracy)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exercise Section */}
            <div>
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
