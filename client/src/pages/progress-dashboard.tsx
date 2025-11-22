import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Settings,
  User,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import DarkModeToggle from "@/components/DarkModeToggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import FluentiLogo from "@/components/FluentiLogo";
import SharedSidebar from "@/components/layout/SharedSidebar";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { useStoryGameProgress, useStoryGameSessions, StoryGameSession } from "@/hooks/useStoryGameProgress";

/* ---------- Types ---------- */
interface UserProgress {
  overallAccuracy: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
  level: number;
  weeklyGoal: number;
  thisWeekSessions: number;
}

interface SessionData {
  id: string;
  sessionType: string;
  accuracyScore: number;
  wordsCompleted: number;
  createdAt: string;
}

interface WeeklyData {
  day: string;
  sessions: number;
  accuracy: number;
  date: string;
}

export default function ProgressDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  
  // Fetch story game progress and sessions
  const { progress: storyGameProgress, isLoading: storyGameLoading } = useStoryGameProgress();
  const { sessions: allSessions, isLoading: sessionsLoading } = useStoryGameSessions(100);

  // Calculate metrics from real data
  const calculateMetrics = () => {
    if (!allSessions || allSessions.length === 0) {
      return {
        progress: {
          overallAccuracy: 0,
          sessionsCompleted: 0,
          totalPracticeTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievements: [],
          level: 1,
          weeklyGoal: 5,
          thisWeekSessions: 0
        },
        recentSessions: [],
        weeklyData: [],
        weekRange: ""
      };
    }

    // Calculate current week range
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (selectedWeekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const weekRange = `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;

    // Filter sessions for the selected week
    const weekSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.createdAt);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });

    // Calculate total practice time (in minutes)
    // Use duration if available, otherwise calculate from startTime and endTime
    const totalPracticeTime = allSessions.reduce((total, session) => {
      let duration = 0;
      if (session.duration) {
        duration = session.duration; // duration is in seconds
      } else if (session.startTime && session.endTime) {
        // Calculate duration from start and end times
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)); // convert to seconds
      }
      return total + Math.floor(duration / 60); // convert to minutes
    }, 0);

    // Calculate streak (consecutive days with sessions)
    const sessionsByDate = new Set<string>();
    allSessions.forEach(session => {
      const date = new Date(session.startTime || session.createdAt);
      date.setHours(0, 0, 0, 0);
      sessionsByDate.add(date.toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(sessionsByDate).sort().reverse(); // Most recent first
    
    // Calculate current streak (from today/yesterday backwards)
    let currentStreak = 0;
    const todayForStreak = new Date();
    todayForStreak.setHours(0, 0, 0, 0);
    const yesterday = new Date(todayForStreak);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let checkDate = new Date(todayForStreak);
    for (let i = 0; i < sortedDates.length; i++) {
      const sessionDate = new Date(sortedDates[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0 || (i === 0 && (sessionDate.getTime() === todayForStreak.getTime() || sessionDate.getTime() === yesterday.getTime()))) {
        currentStreak++;
        checkDate = new Date(sessionDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (daysDiff > 1) {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Get recent sessions (last 3)
    const recentSessions: SessionData[] = allSessions
      .slice(0, 3)
      .map(session => {
        // storyLength is the number of story chunks (AI + user turns)
        // wordBank contains the unique words the child used
        // Use wordBank length if available, otherwise use storyLength as fallback
        const wordCount = session.wordBank?.length || session.storyLength || 0;
        return {
          id: session.id,
          sessionType: session.therapyType,
          accuracyScore: session.speechScore || 0,
          wordsCompleted: wordCount,
          createdAt: session.startTime || session.createdAt
        };
      });

    // Calculate weekly data
    const weeklyData: WeeklyData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const daySessions = weekSessions.filter(session => {
        const sessionDate = new Date(session.startTime || session.createdAt);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      
      const avgScore = daySessions.length > 0
        ? Math.round(daySessions.reduce((sum, s) => sum + (s.speechScore || 0), 0) / daySessions.length)
        : 0;

      weeklyData.push({
        day: dayName,
        sessions: daySessions.length,
        accuracy: avgScore,
        date: dateStr
      });
    }

    // Calculate this week's sessions count
    const thisWeekSessions = selectedWeekOffset === 0 ? weekSessions.length : weekSessions.length;

    return {
      progress: {
        overallAccuracy: allSessions.length > 0
          ? Math.round(allSessions.reduce((sum, s) => sum + (s.speechScore || 0), 0) / allSessions.length)
          : 0,
        sessionsCompleted: allSessions.length,
        totalPracticeTime,
        currentStreak,
        longestStreak,
        achievements: [],
        level: storyGameProgress?.currentLevels?.pronunciation || 1,
        weeklyGoal: 5,
        thisWeekSessions
      },
      recentSessions,
      weeklyData,
      weekRange
    };
  };

  const metricsData = calculateMetrics();
  const progressLoading = storyGameLoading || sessionsLoading;
  const progressData = {
    progress: metricsData.progress,
    recentSessions: metricsData.recentSessions,
    messageCount: 0,
    weeklyData: metricsData.weeklyData,
    weekRange: metricsData.weekRange
  };
  const error = null;

  // Prepare chart data
  const prepareChartData = () => {
    // Therapy type distribution
    const therapyTypeCounts = allSessions.reduce((acc, session) => {
      const type = session.therapyType || 'pronunciation';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const therapyTypeData = [
      { name: 'Pronunciation', value: therapyTypeCounts.pronunciation || 0, color: '#F5B82E' },
      { name: 'Fluency', value: therapyTypeCounts.fluency || 0, color: '#3B82F6' },
      { name: 'Language Building', value: therapyTypeCounts.dld || 0, color: '#8B5CF6' },
      { name: 'Social Communication', value: therapyTypeCounts.social || 0, color: '#10B981' }
    ].filter(item => item.value > 0);

    // Sessions over time (last 30 days)
    const sessionsOverTime: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      sessionsOverTime[dateKey] = 0;
    }
    
    allSessions.forEach(session => {
      const sessionDate = new Date(session.startTime || session.createdAt);
      const dateKey = sessionDate.toISOString().split('T')[0];
      if (sessionsOverTime.hasOwnProperty(dateKey)) {
        sessionsOverTime[dateKey]++;
      }
    });

    const sessionsOverTimeData = Object.entries(sessionsOverTime).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: count,
      fullDate: date
    }));

    // Level progress comparison
    const levelProgressData = storyGameProgress ? [
      {
        therapy: 'Pronunciation',
        initial: storyGameProgress.assessments?.pronunciation?.level || 1,
        current: storyGameProgress.currentLevels?.pronunciation || 1
      },
      {
        therapy: 'Fluency',
        initial: storyGameProgress.assessments?.fluency?.level || 1,
        current: storyGameProgress.currentLevels?.fluency || 1
      },
      {
        therapy: 'Language',
        initial: storyGameProgress.assessments?.dld?.level || 1,
        current: storyGameProgress.currentLevels?.dld || 1
      },
      {
        therapy: 'Social',
        initial: storyGameProgress.assessments?.social?.level || 1,
        current: storyGameProgress.currentLevels?.social || 1
      }
    ] : [];

    // Performance metrics for radar chart
    const performanceData = storyGameProgress ? [
      {
        metric: 'Sessions',
        value: Math.min((allSessions.length / 50) * 100, 100)
      },
      {
        metric: 'Accuracy',
        value: progressData.progress.overallAccuracy
      },
      {
        metric: 'Level',
        value: Math.min(((storyGameProgress.currentLevels?.pronunciation || 1) / 10) * 100, 100)
      },
      {
        metric: 'Streak',
        value: Math.min((progressData.progress.currentStreak / 30) * 100, 100)
      },
      {
        metric: 'Stories',
        value: Math.min((storyGameProgress.totalStoriesCompleted / 20) * 100, 100)
      }
    ] : [];

    return {
      therapyTypeData,
      sessionsOverTimeData,
      levelProgressData,
      performanceData
    };
  };

  const chartData = prepareChartData();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-foreground/80 child-dashboard-no-zoom">
        <div className="text-center child-dashboard-container px-4">
          Loading…
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 child-dashboard-no-zoom">
        <div className="text-center child-dashboard-container px-4">
          Failed to load progress data.
        </div>
      </div>
    );
  }

  const progress = progressData?.progress;
  const weeklyGoalProgress = progress ? Math.min((progress.thisWeekSessions / progress.weeklyGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex child-dashboard-no-zoom">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)} 
        currentPage="progress"
      />

      {/* Main Content */}
      <main className="ml-20 w-full child-dashboard-container">
        {/* Top controls (right) */}
        <PageHeader className="flex justify-end items-center gap-4 px-4 sm:px-5 py-4 sm:py-5" />

        {/* Date pager pill — Enhanced with better navigation */}
        <div className="px-4 sm:px-5">
          <div className="mx-auto max-w-[600px]">
            <div className="mx-auto h-11 rounded-full bg-neutral-100 dark:bg-muted/30 flex items-center justify-between px-3">
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4.5 h-4.5 text-gray-900 dark:text-gray-100" />
              </button>
              <span className="text-[15px] font-medium tracking-tight select-none text-gray-900 dark:text-gray-100">
                {progressData?.weekRange || "Loading..."}
              </span>
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                disabled={selectedWeekOffset >= 0}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50"
                aria-label="Next week"
              >
                <ChevronRight className="w-4.5 h-4.5 text-gray-900 dark:text-gray-100" />
              </button>
            </div>
          </div>
        </div>

        {/* Title + Enhanced weekly overview */}
        <section className="px-5 pt-9">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-[26px] font-bold mb-8">
              {selectedWeekOffset === 0 ? 'your week' : 'week overview'}
            </h1>

            {/* Weekly Progress Ring */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/30"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke="#F5B82E"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - weeklyGoalProgress / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{progress?.thisWeekSessions || 0}</span>
                  <span className="text-xs text-muted-foreground">/ {progress?.weeklyGoal || 5}</span>
                </div>
              </div>
            </div>

            <p className="text-[15px] text-muted-foreground mb-6">
              {selectedWeekOffset === 0 
                ? weeklyGoalProgress >= 100 
                  ? 'Weekly goal completed!' 
                  : `${Math.round(weeklyGoalProgress)}% of weekly goal completed`
                : 'Historical week data'
              }
            </p>

            {selectedWeekOffset === 0 && (
              <button
                onClick={() => setLocation('/story-game')}
                className="inline-flex items-center gap-2 bg-[#F5B82E] text-black px-5 py-2.5 rounded-lg text-[15px] font-semibold hover:opacity-90 transition"
              >
                start session <ArrowRight className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </section>

        {/* Enhanced Stats Grid */}
        <section className="px-5 mt-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-border grid place-items-center text-muted-foreground text-xs"></span>
              key metrics
            </h2>

            {/* Metrics Grid with Visual Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Current Streak */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">STREAK</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {progress?.currentStreak || 0}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {progress?.currentStreak === 1 ? 'day' : 'days'}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((progress?.currentStreak || 0) / 30 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Overall Accuracy */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#F5B82E]" />
                  <span className="text-xs font-medium text-muted-foreground">ACCURACY</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {progress?.overallAccuracy || 0}%
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Average score
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#F5B82E] rounded-full transition-all duration-500"
                    style={{ width: `${progress?.overallAccuracy || 0}%` }}
                  />
                </div>
              </div>

              {/* Sessions Completed */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">SESSIONS</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {progress?.sessionsCompleted || 0}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Total completed
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((progress?.sessionsCompleted || 0) / 100 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Activity Chart - Bar Chart */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                daily activity
              </h3>
              {progressData?.weeklyData && progressData.weeklyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressData.weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="day" 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'sessions') return [`${value} session${value !== 1 ? 's' : ''}`, 'Sessions'];
                          if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey="sessions" 
                        fill="#F5B82E" 
                        radius={[4, 4, 0, 0]}
                        name="sessions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No activity data for this week</p>
                </div>
              )}
            </div>

            {/* Sessions Over Time - Area Chart */}
            {chartData.sessionsOverTimeData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  sessions over time (last 30 days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.sessionsOverTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5B82E" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F5B82E" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} session${value !== 1 ? 's' : ''}`, 'Sessions']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#F5B82E" 
                        fillOpacity={1}
                        fill="url(#colorSessions)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Therapy Type Distribution */}
            {chartData.therapyTypeData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  therapy type distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.therapyTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.therapyTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value} session${value !== 1 ? 's' : ''}`, 'Sessions']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.therapyTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          width={50}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value} session${value !== 1 ? 's' : ''}`, 'Sessions']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {chartData.therapyTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sessions with Visual Timeline */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                recent sessions
              </h3>
              {progressData?.recentSessions && progressData.recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {progressData.recentSessions.map((session, index) => {
                    const sessionDate = new Date(session.createdAt);
                    const therapyName = session.sessionType === 'dld' 
                      ? 'Language Building' 
                      : session.sessionType === 'social'
                      ? 'Social Communication'
                      : session.sessionType === 'fluency'
                      ? 'Fluency & Stuttering'
                      : 'Pronunciation';
                    
                    const therapyColors = {
                      pronunciation: '#F5B82E',
                      fluency: '#3B82F6',
                      dld: '#8B5CF6',
                      social: '#10B981'
                    };
                    
                    const color = therapyColors[session.sessionType as keyof typeof therapyColors] || '#F5B82E';
                    
                    return (
                      <div key={session.id} className="relative">
                        {index < progressData.recentSessions.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="relative z-10 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center" style={{ backgroundColor: color }}>
                            <div className="w-2 h-2 rounded-full bg-background" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium capitalize">{therapyName}</div>
                              <div className="text-sm font-bold" style={{ color }}>
                                {session.accuracyScore}%
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${session.accuracyScore}%`,
                                  backgroundColor: color
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">No sessions yet. Start playing to see your progress!</p>
                  <button 
                    onClick={() => setLocation('/story-game')}
                    className="text-[#F5B82E] text-sm hover:underline mt-2"
                  >
                    Start your first session →
                  </button>
                </div>
              )}
            </div>

            {/* Story Game Profile */}
            {storyGameProgress && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  story game profile
                </h3>
                
                {/* Therapy Focus */}
                {storyGameProgress.selectedTherapyType && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-2">CURRENT FOCUS</div>
                    <div className="text-lg font-bold capitalize">
                      {storyGameProgress.selectedTherapyType === 'dld' 
                        ? 'Language Building' 
                        : storyGameProgress.selectedTherapyType === 'social'
                        ? 'Social Communication'
                        : storyGameProgress.selectedTherapyType === 'fluency'
                        ? 'Fluency & Stuttering'
                        : 'Pronunciation'}
                    </div>
                  </div>
                )}

                {/* Assessment Results for All Therapy Types */}
                <div className="mb-6">
                  <div className="text-xs font-medium text-muted-foreground mb-3">INITIAL ASSESSMENT RESULTS</div>
                  <div className="space-y-3">
                    {(['pronunciation', 'fluency', 'dld', 'social'] as const).map((therapyType) => {
                      const assessment = storyGameProgress.assessments?.[therapyType];
                      
                      const therapyName = therapyType === 'dld' 
                        ? 'Language Building' 
                        : therapyType === 'social'
                        ? 'Social Communication'
                        : therapyType === 'fluency'
                        ? 'Fluency & Stuttering'
                        : 'Pronunciation';
                      
                      // Color coding based on therapy type
                      const therapyColors = {
                        pronunciation: {
                          bg: 'bg-[--primary-bg-light]',
                          border: 'border-[--primary]',
                          text: 'text-[--primary-dark]'
                        },
                        fluency: {
                          bg: 'bg-[--primary-bg-light]',
                          border: 'border-[--primary]',
                          text: 'text-[--primary-dark]'
                        },
                        dld: {
                          bg: 'bg-purple-50',
                          border: 'border-purple-300',
                          text: 'text-purple-600'
                        },
                        social: {
                          bg: 'bg-[--secondary-light]',
                          border: 'border-[--secondary]',
                          text: 'text-[--secondary-dark]'
                        }
                      };
                      
                      const colors = therapyColors[therapyType];
                      
                      return (
                        <div 
                          key={therapyType} 
                          className={`p-4 rounded-lg border-2 ${colors.border} ${assessment ? colors.bg : 'bg-muted/30'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold capitalize ${colors.text}`}>{therapyName}</span>
                            {assessment ? (
                              <span className="text-lg font-bold text-[#F5B82E]">
                                Level {assessment.level}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Not assessed yet
                              </span>
                            )}
                          </div>
                          {assessment ? (
                            <>
                              {assessment.title && (
                                <div className="text-sm text-muted-foreground mb-1">
                                  {assessment.title}
                                </div>
                              )}
                              {assessment.feedback && (
                                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {assessment.feedback}
                                </div>
                              )}
                              {assessment.completedAt && (
                                <div className="text-xs text-muted-foreground">
                                  Assessed: {new Date(assessment.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Complete the assessment to see your initial level
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Level Progress Comparison Chart */}
                {chartData.levelProgressData.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-medium text-muted-foreground mb-3">LEVEL PROGRESS COMPARISON</div>
                    <div className="bg-muted/30 rounded-lg p-4 mb-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.levelProgressData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="therapy" 
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <YAxis 
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="initial" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Initial Level" />
                            <Bar dataKey="current" fill="#F5B82E" radius={[4, 4, 0, 0]} name="Current Level" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Radar Chart */}
                {chartData.performanceData.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-medium text-muted-foreground mb-3">PERFORMANCE OVERVIEW</div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={chartData.performanceData}>
                            <PolarGrid />
                            <PolarAngleAxis 
                              dataKey="metric" 
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 100]}
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <Radar 
                              name="Performance" 
                              dataKey="value" 
                              stroke="#F5B82E" 
                              fill="#F5B82E" 
                              fillOpacity={0.6}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number) => [`${value.toFixed(0)}%`, 'Score']}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Progress by Therapy Type */}
                <div className="mb-6">
                  <div className="text-xs font-medium text-muted-foreground mb-3">CURRENT PROGRESS BY THERAPY TYPE</div>
                  <div className="space-y-3">
                    {(['pronunciation', 'fluency', 'dld', 'social'] as const).map((therapyType) => {
                      const level = storyGameProgress.currentLevels?.[therapyType] || 1;
                      const assessment = storyGameProgress.assessments?.[therapyType];
                      const stats = storyGameProgress.therapyStats?.[therapyType];
                      
                      const isSelected = storyGameProgress.selectedTherapyType === therapyType;
                      
                      const therapyName = therapyType === 'dld' 
                        ? 'Language Building' 
                        : therapyType === 'social'
                        ? 'Social Communication'
                        : therapyType === 'fluency'
                        ? 'Fluency & Stuttering'
                        : 'Pronunciation';
                      
                      const maxLevel = 10;
                      const levelProgress = (level / maxLevel) * 100;
                      
                      return (
                        <div 
                          key={therapyType}
                          className={`p-4 rounded-lg border ${
                            isSelected 
                              ? 'border-[#F5B82E] bg-[#F5B82E]/10' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-sm font-bold capitalize mb-1">{therapyName}</div>
                              {assessment && (
                                <div className="text-xs text-muted-foreground mb-2">
                                  {level === assessment.level ? (
                                    <span>Initial & Current: Level {level} <span className="text-muted-foreground/70">(No progress yet)</span></span>
                                  ) : (
                                    <span>Initial: Level {assessment.level} → Current: Level {level}</span>
                                  )}
                                </div>
                              )}
                              {!assessment && (
                                <div className="text-xs text-muted-foreground mb-2">
                                  Current: Level {level}
                                </div>
                              )}
                              {/* Level Progress Bar */}
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#F5B82E] rounded-full transition-all duration-500"
                                  style={{ width: `${levelProgress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-[#F5B82E] ml-4">
                              {level}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>



                {!storyGameProgress.hasCompletedInitialSetup && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setLocation('/story-game')}
                      className="inline-flex items-center gap-2 bg-[#F5B82E] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                    >
                      Start Story Game <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
        />
      </main>
    </div>
  );
}