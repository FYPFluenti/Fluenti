import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MessageCircle, User, Star, Gift, Heart, Smile, ArrowRight } from "lucide-react";
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
              <p className="text-sm text-yellow-700">Stars Earned</p>
              <p className="text-2xl font-bold text-yellow-800">24</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-100 to-green-200">
            <CardContent className="p-4 text-center">
              <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700">Rewards</p>
              <p className="text-2xl font-bold text-green-800">3</p>
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

        {/* Main Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Speech Games */}
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <MessageCircle className="w-6 h-6" />
                <span>Speech Games</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Play fun games while practicing your speech!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-blue-700">
                    <span>Today's Progress</span>
                    <span>5/8 games</span>
                  </div>
                  <Progress value={62.5} className="h-3 bg-blue-200" />
                </div>
                <Link href="/speech-therapy">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Let's Play! 🎮
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Feelings Helper */}
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-pink-50 to-rose-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-pink-700">
                <Heart className="w-6 h-6" />
                <span>Feelings Helper</span>
              </CardTitle>
              <CardDescription className="text-pink-600">
                Talk about your feelings with our friendly AI buddy!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-pink-700">
                  Our AI friend is here to listen and help you feel better! 🤗
                </p>
                <Link href="/emotional-support">
                  <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                    Chat with Buddy 💬
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement & Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Progress */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
            <CardHeader>
              <CardTitle className="text-green-700">My Progress</CardTitle>
              <CardDescription className="text-green-600">
                See how much you've improved!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/progress">
                <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                  See My Progress 📊
                  <Star className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Fun Test */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-100">
            <CardHeader>
              <CardTitle className="text-orange-700">Fun Speech Test</CardTitle>
              <CardDescription className="text-orange-600">
                Let's see how well you can speak!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assessment">
                <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                  Take the Test 🏆
                  <Gift className="w-4 h-4 ml-2" />
                </Button>
              </Link>
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
