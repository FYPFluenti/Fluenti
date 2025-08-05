import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Star, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Target,
  RefreshCw,
  Award,
  Clock
} from "lucide-react";

interface StatsData {
  wordsToday: number;
  wordGoal: number;
  accuracy: number;
  achievements: number;
  streak: number;
  practiceTime: number;
  sessionsThisWeek: number;
  weeklyGoal: number;
  improvements: {
    words: number;
    accuracy: number;
  };
}

export default function ProgressStats() {
  const [stats, setStats] = useState<StatsData>({
    wordsToday: 15,
    wordGoal: 25,
    accuracy: 88,
    achievements: 12,
    streak: 5,
    practiceTime: 45,
    sessionsThisWeek: 3,
    weeklyGoal: 5,
    improvements: {
      words: 8,
      accuracy: 5
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Fetch stats from API
  const fetchStats = async (period: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stats/${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedPeriod);
  }, [selectedPeriod]);

  const handleRefresh = () => {
    fetchStats(selectedPeriod);
  };

  const progressPercentage = (stats.wordsToday / stats.wordGoal) * 100;
  const weeklyProgress = (stats.sessionsThisWeek / stats.weeklyGoal) * 100;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Your Progress</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {/* Daily Progress Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Words Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Words Practiced</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.wordsToday}/{stats.wordGoal}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                {progressPercentage >= 100 && (
                  <Badge variant="secondary" className="mt-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    Goal Achieved!
                  </Badge>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.accuracy}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                  {stats.improvements.accuracy > 0 && (
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">+{stats.improvements.accuracy}%</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.streak}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                  <Flame className="h-4 w-4 text-orange-500 mx-auto mt-1" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{stats.practiceTime}m</div>
                  <div className="text-sm text-gray-600">Practice Time</div>
                  <Clock className="h-4 w-4 text-blue-500 mx-auto mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {/* Weekly Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Sessions Completed</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.sessionsThisWeek}/{stats.weeklyGoal}
                  </span>
                </div>
                <Progress value={weeklyProgress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{stats.wordsToday * 7}</div>
                  <div className="text-sm text-muted-foreground">Total Words</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{stats.practiceTime * 3}</div>
                  <div className="text-sm text-muted-foreground">Minutes Practiced</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {/* Monthly Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                  <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-xl font-bold">{stats.achievements}</div>
                  <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-xl font-bold">{stats.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Average Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              View Detailed Report
            </Button>
            <Button variant="outline" size="sm">
              Set New Goals
            </Button>
            <Button variant="outline" size="sm">
              Share Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}