import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link } from "wouter";
import { MessageCircle, User, BarChart3, Target, Clock, Trophy, ArrowRight, Heart, Brain, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface User {
  firstName?: string;
  lastName?: string;
}

export default function AdultDashboard() {
  const { user } = useAuth() as { user: User };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-primary">Fluenti</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <Badge variant="outline">Adult</Badge>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Continue your personalized speech therapy journey. Track your progress and improve your communication skills.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Therapy Sessions</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Mood Score</p>
                  <p className="text-2xl font-bold">7.2/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Session Streak</p>
                  <p className="text-2xl font-bold">5 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Wellness Goals</p>
                  <p className="text-2xl font-bold">3/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Emotional Support - Primary Feature for Adults */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span>Emotional Therapy & Support</span>
              </CardTitle>
              <CardDescription>
                AI-powered emotional support, therapy sessions, and mental wellness guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Today's Mood</h4>
                    <p className="text-sm text-blue-700">Track your emotional wellbeing</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Therapy Sessions</h4>
                    <p className="text-sm text-green-700">3 sessions this week</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Access personalized emotional support, coping strategies, mindfulness exercises, and therapeutic conversations with AI guidance.
                </p>
                <Link href="/emotional-support">
                  <Button className="w-full fluenti-button-primary text-lg py-3">
                    Start Emotional Therapy Session
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emotional Support Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mood Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span>Mood Tracking</span>
              </CardTitle>
              <CardDescription>
                Monitor your emotional patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today's Mood:</span>
                  <span className="text-sm font-medium">😊 Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weekly Average:</span>
                  <span className="text-sm font-medium">7.2/10</span>
                </div>
                <Link href="/emotional-support">
                  <Button variant="outline" className="w-full">
                    Log Mood
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Therapy Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Therapy Tools</span>
              </CardTitle>
              <CardDescription>
                Access therapeutic techniques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Available Tools:</p>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Mindfulness exercises</li>
                    <li>• Breathing techniques</li>
                    <li>• CBT strategies</li>
                  </ul>
                </div>
                <Link href="/emotional-support">
                  <Button variant="outline" className="w-full">
                    Access Tools
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-500" />
                <span>Crisis Support</span>
              </CardTitle>
              <CardDescription>
                24/7 emergency emotional support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Immediate support when you need it most
                </p>
                <Link href="/emotional-support">
                  <Button variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                    Get Help Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
