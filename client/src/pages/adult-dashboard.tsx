import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MessageCircle, User, BarChart3, Target, Clock, Trophy, ArrowRight } from "lucide-react";
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
              <Button variant="outline" size="sm">
                <Link href="/api/logout">Logout</Link>
              </Button>
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
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Sessions Completed</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Average Accuracy</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold">7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Achievements</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Speech Therapy */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Speech Therapy</span>
              </CardTitle>
              <CardDescription>
                Practice pronunciation and improve your speech accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Goal Progress</span>
                    <span>7/10 exercises</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <Link href="/speech-therapy">
                  <Button className="w-full fluenti-button-primary">
                    Continue Practice
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Emotional Support */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Emotional Support</span>
              </CardTitle>
              <CardDescription>
                AI-powered emotional support and guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Get personalized emotional support and coping strategies for your speech therapy journey.
                </p>
                <Link href="/emotional-support">
                  <Button className="w-full" variant="outline">
                    Start Session
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Analytics</CardTitle>
              <CardDescription>
                Detailed insights into your improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/progress">
                <Button variant="outline" className="w-full">
                  View Progress
                  <BarChart3 className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Speech Assessment</CardTitle>
              <CardDescription>
                Evaluate your current speech abilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assessment">
                <Button variant="outline" className="w-full">
                  Take Assessment
                  <Target className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
