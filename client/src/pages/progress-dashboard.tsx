import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressChart } from "@/components/progress/progress-chart";
import { Achievements } from "@/components/gamification/achievements";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { Link } from "wouter";
import { 
  MessageCircle, 
  Home, 
  ArrowLeft, 
  BarChart3,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Download,
  Share,
  CalendarPlus,
  Star,
  Flame,
  Award,
  Users,
  Eye
} from "lucide-react";

interface UserProgress {
  overallAccuracy: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
  level: number;
}

interface SessionData {
  id: string;
  sessionType: string;
  accuracyScore: number;
  wordsCompleted: number;
  createdAt: string;
}

export default function ProgressDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user progress
  const { data: progressData, isLoading: progressLoading, error } = useQuery({
    queryKey: ['/api/speech/progress'],
    enabled: !!isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
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
  }, [error, toast]);

  if (isLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const progress = (progressData as any)?.progress || {
    overallAccuracy: 0,
    sessionsCompleted: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: [],
    level: 1
  };

  const recentSessions = (progressData as any)?.recentSessions || [];

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Sample weekly data for chart
  const weeklyData = [
    { day: 'Mon', accuracy: 85, sessions: 2 },
    { day: 'Tue', accuracy: 92, sessions: 1 },
    { day: 'Wed', accuracy: 88, sessions: 3 },
    { day: 'Thu', accuracy: 95, sessions: 2 },
    { day: 'Fri', accuracy: 90, sessions: 1 },
    { day: 'Sat', accuracy: 87, sessions: 2 },
    { day: 'Sun', accuracy: 93, sessions: 1 }
  ];

  const achievements = [
    {
      id: 'perfect_score',
      title: 'Perfect Pronunciation',
      description: 'Achieved 100% accuracy on 5 words',
      icon: Star,
      color: 'bg-yellow-500',
      date: 'Today'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Completed session in record time',
      icon: Clock,
      color: 'bg-blue-500',
      date: 'Yesterday'
    },
    {
      id: 'week_warrior',
      title: 'Week Warrior',
      description: '7 consecutive days of practice',
      icon: Flame,
      color: 'bg-red-500',
      date: 'Today'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white text-lg" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-primary">Fluenti</span>
                  <p className="text-sm text-gray-600">Progress Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <Card className="fluenti-card mb-8 bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {(user as any)?.firstName || 'User'}'s Progress Dashboard
                </h1>
                <p className="opacity-90">
                  Last session: {recentSessions.length > 0 
                    ? new Date(recentSessions[0]?.createdAt).toLocaleDateString()
                    : 'No sessions yet'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {Math.max(1, Math.floor((Date.now() - new Date((user as any)?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))}
                </div>
                <div className="opacity-90">Days Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="fluenti-card text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {Math.round(progress.overallAccuracy)}%
              </div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </CardContent>
          </Card>

          <Card className="fluenti-card text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Clock className="text-white" />
              </div>
              <div className="text-3xl font-bold text-secondary mb-1">
                {formatTime(progress.totalPracticeTime)}
              </div>
              <div className="text-sm text-gray-600">Practice Time</div>
            </CardContent>
          </Card>

          <Card className="fluenti-card text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Trophy className="text-white" />
              </div>
              <div className="text-3xl font-bold text-accent mb-1">
                {progress.achievements.length}
              </div>
              <div className="text-sm text-gray-600">Achievements</div>
            </CardContent>
          </Card>

          <Card className="fluenti-card text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Flame className="text-white" />
              </div>
              <div className="text-3xl font-bold text-red-500 mb-1">
                {progress.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Chart */}
          <Card className="fluenti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="text-primary" />
                <span>Weekly Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart data={weeklyData} />
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="fluenti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="text-accent" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border">
                  <div className={`w-10 h-10 ${achievement.color} rounded-full flex items-center justify-center`}>
                    <achievement.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{achievement.title}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                  <span className="text-xs text-gray-500">{achievement.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Session History & Goals */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Session History */}
          <Card className="fluenti-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="text-secondary" />
                <span>Recent Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.slice(0, 5).map((session: SessionData) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {session.sessionType} Session
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-secondary">
                          {Math.round(session.accuracyScore || 0)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.wordsCompleted} words
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions completed yet</p>
                  <p className="text-sm">Start your first speech therapy session!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals & Actions */}
          <div className="space-y-6">
            {/* Current Goals */}
            <Card className="fluenti-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="text-primary" />
                  <span>Current Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekly Sessions</span>
                  <Badge variant="outline">3/5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accuracy Goal</span>
                  <Badge variant="outline">85%+</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Practice Streak</span>
                  <Badge variant="outline">{progress.currentStreak} days</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="fluenti-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full fluenti-button-primary text-sm" asChild>
                  <Link href="/speech-therapy">
                    <Target className="mr-2 h-4 w-4" />
                    Practice Now
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                
                <Button variant="outline" className="w-full text-sm">
                  <Share className="mr-2 h-4 w-4" />
                  Share Progress
                </Button>
                
                <Button className="w-full fluenti-button-secondary text-sm">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
