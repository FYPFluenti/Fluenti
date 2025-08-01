import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { MessageCircle, User, Star, Gift, Heart, Smile, ArrowRight, BookOpen, Mic, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface User {
  firstName?: string;
  lastName?: string;
}

export default function ChildDashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-pink-300/20 rounded-full fluenti-float"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-purple-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-blue-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 hover-lift">
              <div className="w-10 h-10 fluenti-gradient-warm rounded-xl flex items-center justify-center shadow-lg fluenti-pulse">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-gradient-warm">Fluenti Kids</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-pink-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-pink-700 font-medium">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </span>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-sm font-medium border border-pink-200">
                Child
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-warm">Hi {(user as any)?.firstName}!</span> 
            <span className="text-4xl ml-2">🌟</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Ready to have fun while learning to speak better? Let's go on an adventure! 🚀
          </p>
        </div>

        {/* Fun Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-yellow-100 to-yellow-200 hover:shadow-yellow-200/50 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2 fluenti-pulse" />
              <p className="text-sm text-yellow-700 font-medium">Words Practiced</p>
              <p className="text-3xl font-bold text-yellow-800">47</p>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-green-100 to-green-200 hover:shadow-green-200/50 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="p-4 text-center">
              <Gift className="w-8 h-8 text-green-600 mx-auto mb-2 fluenti-pulse" />
              <p className="text-sm text-green-700 font-medium">Games Won</p>
              <p className="text-3xl font-bold text-green-800">12</p>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-blue-100 to-blue-200 hover:shadow-blue-200/50 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="p-4 text-center">
              <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2 fluenti-pulse" />
              <p className="text-sm text-blue-700 font-medium">Practice Days</p>
              <p className="text-3xl font-bold text-blue-800">7</p>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-purple-100 to-purple-200 hover:shadow-purple-200/50 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="p-4 text-center">
              <Smile className="w-8 h-8 text-purple-600 mx-auto mb-2 fluenti-pulse" />
              <p className="text-sm text-purple-700 font-medium">Best Score</p>
              <p className="text-3xl font-bold text-purple-800">98%</p>
            </div>
          </div>
        </div>

        {/* Main Activities - Speech Therapy Focus */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Speech Games - Primary Feature for Children */}
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-2xl hover:shadow-blue-200/50 animate-slide-up" style={{animationDelay: '0.5s'}}>
            <div className="p-8">
              <div className="flex items-center space-x-3 text-blue-700 mb-4">
                <MessageCircle className="w-10 h-10 fluenti-pulse" />
                <h2 className="text-3xl font-bold">🎮 Super Speech Games! 🎮</h2>
              </div>
              <p className="text-blue-600 text-xl mb-6 leading-relaxed">
                Play amazing games while learning to speak like a superhero! 🦸‍♀️
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="fluenti-card bg-gradient-to-br from-pink-100 to-pink-200 hover-lift">
                    <div className="p-4 text-center">
                      <MessageCircle className="w-8 h-8 text-pink-600 mx-auto mb-2 fluenti-pulse" />
                      <h4 className="font-bold text-pink-800 mb-2">Word Adventures</h4>
                      <p className="text-sm text-pink-700">Practice saying words like a pro!</p>
                    </div>
                  </div>
                  <div className="fluenti-card bg-gradient-to-br from-green-100 to-green-200 hover-lift">
                    <div className="p-4 text-center">
                      <Star className="w-8 h-8 text-green-600 mx-auto mb-2 fluenti-pulse" />
                      <h4 className="font-bold text-green-800 mb-2">Pronunciation Power</h4>
                      <p className="text-sm text-green-700">Make words sound perfect!</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-blue-700 font-medium">
                    <span>Today's Speech Adventure Progress</span>
                    <span>3/5 games completed 🌟</span>
                  </div>
                  <div className="fluenti-pronunciation-bar">
                    <div className="fluenti-pronunciation-fill w-[60%]"></div>
                  </div>
                </div>
                <Link href="/speech-therapy">
                  <button className="w-full fluenti-button-primary text-xl py-4 hover-lift animate-bounce-gentle">
                    🚀 Start Playing Speech Games! 🚀
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Speech Learning Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Word Practice */}
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-orange-200/50 animate-slide-up" style={{animationDelay: '0.6s'}}>
            <div className="p-6">
              <div className="text-orange-700 flex items-center space-x-2 mb-4">
                <BookOpen className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">Word Practice</h3>
              </div>
              <p className="text-orange-600 mb-4">
                Practice saying words clearly! 📚
              </p>
              <div className="space-y-3">
                <p className="text-sm text-orange-700">
                  Learn new words and practice saying them perfectly! 🎯
                </p>
                <Link href="/speech-therapy">
                  <button className="w-full fluenti-button-outline text-orange-700 hover:bg-orange-100 border-orange-300 hover-lift">
                    Practice Words 📝
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Voice Games */}
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-green-200/50 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <div className="p-6">
              <div className="text-green-700 flex items-center space-x-2 mb-4">
                <Mic className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">Voice Games</h3>
              </div>
              <p className="text-green-600 mb-4">
                Fun voice challenges! 🎤
              </p>
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  Play fun games with your voice and win rewards! 🏆
                </p>
                <Link href="/speech-therapy">
                  <button className="w-full fluenti-button-outline text-green-700 hover:bg-green-100 border-green-300 hover-lift">
                    Play Voice Games 🎮
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* My Progress */}
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-purple-200/50 animate-slide-up" style={{animationDelay: '0.8s'}}>
            <div className="p-6">
              <div className="text-purple-700 flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 fluenti-pulse" />
                <h3 className="text-xl font-bold">My Achievements</h3>
              </div>
              <p className="text-purple-600 mb-4">
                See how awesome you are! ⭐
              </p>
              <div className="space-y-3">
                <p className="text-sm text-purple-700">
                  Check your amazing progress and collect stars! 🌟
                </p>
                <button className="w-full fluenti-button-outline text-purple-700 hover:bg-purple-100 border-purple-300 hover-lift">
                  See My Stars ⭐
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Encouragement Section */}
        <div className="mt-8 text-center animate-fade-in" style={{animationDelay: '0.9s'}}>
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-r from-purple-100 to-pink-100 hover:shadow-2xl hover:shadow-purple-200/50">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-purple-700 mb-4 animate-bounce-gentle">You're Doing Great! 🌟</h3>
              <p className="text-purple-600 text-lg leading-relaxed">
                Keep practicing and you'll become an amazing speaker! Every word you practice makes you stronger! 💪
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
