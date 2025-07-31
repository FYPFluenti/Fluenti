import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link } from "wouter";
import { MessageCircle, User, Star, Gift, Heart, Smile, ArrowRight, BookOpen, Mic, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ChildDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-purple-600">Fluenti Kids</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm text-gray-600">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </span>
              </div>
              <Badge variant="outline" className="bg-pink-100 text-pink-700">Child</Badge>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hi {(user as any)?.firstName}! 🌟
          </h1>
          <p className="text-lg text-gray-600">
            Ready to have fun while learning to speak better? Let's go on an adventure!
          </p>
        </div>

        {/* Fun Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-700">Words Practiced</p>
              <p className="text-2xl font-bold text-yellow-800">47</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-100 to-green-200">
            <CardContent className="p-4 text-center">
              <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700">Games Won</p>
              <p className="text-2xl font-bold text-green-800">12</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-100 to-blue-200">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700">Practice Days</p>
              <p className="text-2xl font-bold text-blue-800">7</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-100 to-purple-200">
            <CardContent className="p-4 text-center">
              <Smile className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700">Best Score</p>
              <p className="text-2xl font-bold text-purple-800">98%</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Activities - Speech Therapy Focus */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Speech Games - Primary Feature for Children */}
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <MessageCircle className="w-8 h-8" />
                <span className="text-2xl">🎮 Super Speech Games! 🎮</span>
              </CardTitle>
              <CardDescription className="text-blue-600 text-lg">
                Play amazing games while learning to speak like a superhero! 🦸‍♀️
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-pink-100 rounded-lg text-center">
                    <MessageCircle className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                    <h4 className="font-bold text-pink-800">Word Adventures</h4>
                    <p className="text-sm text-pink-700">Practice saying words like a pro!</p>
                  </div>
                  <div className="p-4 bg-green-100 rounded-lg text-center">
                    <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-bold text-green-800">Pronunciation Power</h4>
                    <p className="text-sm text-green-700">Make words sound perfect!</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-blue-700 font-medium">
                    <span>Today's Speech Adventure Progress</span>
                    <span>3/5 games completed 🌟</span>
                  </div>
                  <Progress value={60} className="h-4 bg-blue-200" />
                </div>
                <Link href="/speech-therapy">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl py-4">
                    🚀 Start Playing Speech Games! 🚀
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Speech Learning Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Word Practice */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center space-x-2">
                <BookOpen className="w-6 h-6" />
                <span>Word Practice</span>
              </CardTitle>
              <CardDescription className="text-orange-600">
                Practice saying words clearly! 📚
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-orange-700">
                  Learn new words and practice saying them perfectly! 🎯
                </p>
                <Link href="/speech-therapy">
                  <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                    Practice Words 📝
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Voice Games */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center space-x-2">
                <Mic className="w-6 h-6" />
                <span>Voice Games</span>
              </CardTitle>
              <CardDescription className="text-green-600">
                Fun voice challenges! 🎤
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  Play fun games with your voice and win rewards! 🏆
                </p>
                <Link href="/speech-therapy">
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                    Play Voice Games 🎮
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Progress */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100">
            <CardHeader>
              <CardTitle className="text-purple-700 flex items-center space-x-2">
                <Trophy className="w-6 h-6" />
                <span>My Achievements</span>
              </CardTitle>
              <CardDescription className="text-purple-600">
                See how awesome you are! ⭐
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-purple-700">
                  Check your amazing progress and collect stars! 🌟
                </p>
                <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
                  See My Stars ⭐
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Encouragement Section */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-purple-700 mb-2">You're Doing Great! 🌟</h3>
              <p className="text-purple-600">
                Keep practicing and you'll become an amazing speaker! Every word you practice makes you stronger! 💪
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
