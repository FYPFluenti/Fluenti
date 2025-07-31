import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MessageCircle, User, Users, Calendar, TrendingUp, Shield, ArrowRight, Eye, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function GuardianDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Shield className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-green-600">Fluenti Guardian</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm text-gray-600">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700">Guardian</Badge>
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
            Welcome, {(user as any)?.firstName}!
          </h1>
          <p className="text-gray-600">
            Monitor and support your child's speech therapy progress. Access tools and insights to help them succeed.
          </p>
        </div>

        {/* Child Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">Children Monitored</p>
                  <p className="text-2xl font-bold text-blue-800">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Overall Progress</p>
                  <p className="text-2xl font-bold text-green-800">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">This Week</p>
                  <p className="text-2xl font-bold text-purple-800">12 sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700">Active Monitoring</p>
                  <p className="text-2xl font-bold text-orange-800">24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
