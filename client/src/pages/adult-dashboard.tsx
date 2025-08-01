import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { MessageCircle, User, BarChart3, Target, Clock, Trophy, ArrowRight, Heart, Brain, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface User {
  firstName?: string;
  lastName?: string;
}

export default function AdultDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth() as { user: User; isLoading: boolean; isAuthenticated: boolean };
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

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
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-blue-300/20 rounded-full fluenti-float"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-indigo-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-purple-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 hover-lift">
              <div className="w-10 h-10 fluenti-gradient-primary rounded-xl flex items-center justify-center shadow-lg fluenti-pulse">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-gradient-primary">Fluenti</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                Adult
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient-primary">Welcome back, {user?.firstName}!</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Continue your personalized speech therapy journey. Track your progress and improve your communication skills.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="fluenti-card fluenti-card-interactive hover:shadow-red-200/50 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Therapy Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive hover:shadow-purple-200/50 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Mood Score</p>
                  <p className="text-3xl font-bold text-gray-900">7.2<span className="text-lg text-gray-500">/10</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive hover:shadow-blue-200/50 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Session Streak</p>
                  <p className="text-3xl font-bold text-gray-900">5 <span className="text-lg text-gray-500">days</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive hover:shadow-yellow-200/50 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Wellness Goals</p>
                  <p className="text-3xl font-bold text-gray-900">3<span className="text-lg text-gray-500">/5</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Emotional Support - Primary Feature for Adults */}
          <div className="fluenti-card fluenti-card-interactive hover:shadow-2xl hover:shadow-red-200/50 animate-slide-up" style={{animationDelay: '0.5s'}}>
            <div className="p-8">
              <div className="flex items-center space-x-3 text-red-600 mb-4">
                <Heart className="w-8 h-8 fluenti-pulse" />
                <h2 className="text-2xl font-bold">Emotional Therapy & Support</h2>
              </div>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                AI-powered emotional support, therapy sessions, and mental wellness guidance
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="fluenti-card bg-gradient-to-br from-blue-50 to-blue-100 hover-lift">
                    <div className="p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Today's Mood</h4>
                      <p className="text-sm text-blue-700">Track your emotional wellbeing</p>
                    </div>
                  </div>
                  <div className="fluenti-card bg-gradient-to-br from-green-50 to-green-100 hover-lift">
                    <div className="p-4">
                      <h4 className="font-medium text-green-900 mb-2">Therapy Sessions</h4>
                      <p className="text-sm text-green-700">3 sessions this week</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Access personalized emotional support, coping strategies, mindfulness exercises, and therapeutic conversations with AI guidance.
                </p>
                <Link href="/emotional-support">
                  <button className="w-full fluenti-button-primary text-lg py-3 hover-lift">
                    Start Emotional Therapy Session
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Emotional Support Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mood Tracking */}
          <div className="fluenti-card fluenti-card-interactive hover:shadow-pink-200/50 animate-slide-up" style={{animationDelay: '0.6s'}}>
            <div className="p-6">
              <div className="flex items-center space-x-2 text-pink-600 mb-4">
                <Heart className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">Mood Tracking</h3>
              </div>
              <p className="text-gray-600 mb-4">Monitor your emotional patterns</p>
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
                  <button className="w-full fluenti-button-outline hover-lift">
                    Log Mood
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Therapy Tools */}
          <div className="fluenti-card fluenti-card-interactive hover:shadow-purple-200/50 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <div className="p-6">
              <div className="flex items-center space-x-2 text-purple-600 mb-4">
                <Brain className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">Therapy Tools</h3>
              </div>
              <p className="text-gray-600 mb-4">Access therapeutic techniques</p>
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
                  <button className="w-full fluenti-button-outline hover-lift">
                    Access Tools
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Crisis Support */}
          <div className="fluenti-card fluenti-card-interactive hover:shadow-red-200/50 animate-slide-up" style={{animationDelay: '0.8s'}}>
            <div className="p-6">
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <Shield className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">Crisis Support</h3>
              </div>
              <p className="text-gray-600 mb-4">24/7 emergency emotional support</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Immediate support when you need it most
                </p>
                <Link href="/emotional-support">
                  <button className="w-full fluenti-button-accent bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover-lift">
                    Get Help Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
