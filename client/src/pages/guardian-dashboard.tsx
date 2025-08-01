import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { MessageCircle, User, Users, Calendar, TrendingUp, Shield, ArrowRight, Eye, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface User {
  firstName?: string;
  lastName?: string;
}

export default function GuardianDashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-purple-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-green-300/20 rounded-full fluenti-float"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-teal-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-purple-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 hover-lift">
              <div className="w-10 h-10 fluenti-gradient-cool rounded-xl flex items-center justify-center shadow-lg fluenti-pulse">
                <Shield className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-gradient-cool">Fluenti Guardian</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </span>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                Guardian
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
            <span className="text-gradient-cool">Welcome, {(user as any)?.firstName}!</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Monitor and support your child's speech therapy progress. Access tools and insights to help them succeed.
          </p>
        </div>

        {/* Child Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-blue-200/50 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Children Monitored</p>
                  <p className="text-3xl font-bold text-blue-800">2</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-green-50 to-green-100 hover:shadow-green-200/50 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Overall Progress</p>
                  <p className="text-3xl font-bold text-green-800">87%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-purple-200/50 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">This Week</p>
                  <p className="text-3xl font-bold text-purple-800">12 <span className="text-lg text-purple-600">sessions</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-orange-200/50 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-orange-600 fluenti-pulse" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Active Monitoring</p>
                  <p className="text-3xl font-bold text-orange-800">24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Child Progress Management - Primary Feature for Guardians */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Child Progress Monitor */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-6 h-6 text-green-600" />
                <span className="text-2xl">Child Progress Monitoring Center</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Comprehensive view of your children's speech therapy progress and development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Individual Child Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-blue-900 text-lg">Emma (Age 8)</h3>
                        <p className="text-sm text-blue-700">Last session: 2 hours ago</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">92%</p>
                        <p className="text-sm text-gray-600">Speech Accuracy</p>
                      </div>
                    </div>
                    <Progress value={92} className="h-3 mb-3" />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Words Practiced:</p>
                        <p className="font-medium">47 this week</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Games Completed:</p>
                        <p className="font-medium">12 sessions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-purple-900 text-lg">Alex (Age 6)</h3>
                        <p className="text-sm text-purple-700">Last session: 1 day ago</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">78%</p>
                        <p className="text-sm text-gray-600">Speech Accuracy</p>
                      </div>
                    </div>
                    <Progress value={78} className="h-3 mb-3" />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Words Practiced:</p>
                        <p className="font-medium">23 this week</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Games Completed:</p>
                        <p className="font-medium">8 sessions</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="fluenti-button-primary">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Detailed Reports
                  </Button>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Review
                  </Button>
                  <Button variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Progress Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Monitoring Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>Weekly Reports</span>
              </CardTitle>
              <CardDescription>
                Comprehensive weekly progress summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">This Week's Highlights:</p>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Emma: 5% improvement</li>
                    <li>• Alex: Consistent progress</li>
                    <li>• 19 total sessions completed</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full">
                  View Full Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Session Analytics</span>
              </CardTitle>
              <CardDescription>
                Deep insights into therapy sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Key Metrics:</p>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Average session time: 14 min</li>
                    <li>• Engagement rate: 94%</li>
                    <li>• Completion rate: 89%</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full">
                  Analyze Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <span>Progress Alerts</span>
              </CardTitle>
              <CardDescription>
                Real-time notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Recent Alerts:</p>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Emma reached new milestone ✅</li>
                    <li>• Alex needs practice reminder 📝</li>
                    <li>• Weekly goal achieved 🎯</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full">
                  Manage Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>
                Overview of your children's progress this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Emma's Week</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Completed 6 speech exercises</li>
                    <li>📈 Improved accuracy by 5%</li>
                    <li>🏆 Earned 3 new achievements</li>
                    <li>⏰ Average session time: 15 minutes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Alex's Week</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Completed 4 speech exercises</li>
                    <li>📈 Maintained consistent progress</li>
                    <li>🎮 Loved the pronunciation games</li>
                    <li>⏰ Average session time: 12 minutes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
