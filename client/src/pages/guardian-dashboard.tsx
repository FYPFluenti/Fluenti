import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MessageCircle, User, Users, Calendar, TrendingUp, Shield, ArrowRight, Eye } from "lucide-react";
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
                  <p className="text-sm text-blue-700">Children Enrolled</p>
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
                  <p className="text-sm text-green-700">Avg. Progress</p>
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
                <Shield className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700">Safety Score</p>
                  <p className="text-2xl font-bold text-orange-800">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Child Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Child Progress Monitoring */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Child Progress Monitor</span>
              </CardTitle>
              <CardDescription>
                View detailed progress reports and session history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Emma (Age 8)</p>
                    <p className="text-sm text-gray-600">Last session: 2 hours ago</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">92% accuracy</p>
                    <Progress value={92} className="w-20 h-2" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Alex (Age 6)</p>
                    <p className="text-sm text-gray-600">Last session: 1 day ago</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">78% accuracy</p>
                    <Progress value={78} className="w-20 h-2" />
                  </div>
                </div>
                <Link href="/progress">
                  <Button className="w-full fluenti-button-primary">
                    View Detailed Reports
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Resources */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Guardian Resources</span>
              </CardTitle>
              <CardDescription>
                Access tools and guidance for supporting your child
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    📚 Parent's Guide to Speech Therapy
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    🎯 Setting Practice Goals
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    💬 Communication Tips
                  </Button>
                </div>
                <Link href="/emotional-support">
                  <Button className="w-full" variant="outline">
                    Access Guidance Center
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Session Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Schedule Sessions</span>
              </CardTitle>
              <CardDescription>
                Manage therapy sessions and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Assessment Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Assessment Tools</span>
              </CardTitle>
              <CardDescription>
                Track and evaluate speech development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assessment">
                <Button variant="outline" className="w-full">
                  Assessment Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Communication Hub */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Communication</span>
              </CardTitle>
              <CardDescription>
                Connect with therapists and support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Message Center
              </Button>
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
