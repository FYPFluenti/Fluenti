import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link } from "wouter";
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
  LogOut
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated || !user) {
    return null;
  }

  const userType = (user as any)?.userType || 'child';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-primary">Fluenti</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                  {(user as any)?.profileImageUrl ? (
                    <img 
                      src={(user as any).profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-full h-full p-1 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any)?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userType}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              
              <LogoutButton variant="ghost" size="icon" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {(user as any)?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            {userType === 'child' 
              ? "Ready for your speech therapy session today?"
              : userType === 'adult'
              ? "How are you feeling today? I'm here to support you."
              : "Check on your children's progress and schedule new sessions."
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {userType === 'child' && (
            <>
              <Link href="/speech-therapy">
                <Card className="fluenti-card cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Mic className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Start Session</h3>
                    <p className="text-sm text-gray-600">Begin speech therapy</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/assessment">
                <Card className="fluenti-card cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Target className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Assessment</h3>
                    <p className="text-sm text-gray-600">Take speech test</p>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}

          {userType === 'adult' && (
            <Link href="/emotional-support">
              <Card className="fluenti-card cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Brain className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Chat Support</h3>
                  <p className="text-sm text-gray-600">Talk with AI therapist</p>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/progress">
            <Card className="fluenti-card cursor-pointer hover:scale-105 transition-transform">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress</h3>
                <p className="text-sm text-gray-600">View statistics</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="fluenti-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Trophy className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Achievements</h3>
              <p className="text-sm text-gray-600">View rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Stats */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Goals */}
          <Card className="fluenti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Today's Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Practice Sessions</span>
                <Badge variant="outline">0/2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Words Practiced</span>
                <Badge variant="outline">0/20</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Accuracy Goal</span>
                <Badge variant="outline">85%+</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="fluenti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>This Week</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Accuracy</span>
                <span className="font-semibold text-secondary">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Practice Time</span>
                <span className="font-semibold">45m</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="fluenti-card">
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
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">3 Day Streak</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        <Card className="fluenti-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <span>Continue Learning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Pronunciation Practice: Level 2</h3>
                <p className="text-sm text-gray-600">Focus on vowel sounds and clarity</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">65% complete</span>
                </div>
              </div>
              <Link href="/speech-therapy">
                <Button className="fluenti-button-primary">
                  Continue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
