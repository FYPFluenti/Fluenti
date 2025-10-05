import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  Activity
} from "lucide-react";
import SharedSidebar from "@/components/layout/SharedSidebar";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";

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

  const { data: progressData, isLoading: progressLoading, error } = useQuery<{
    progress: UserProgress;
    recentSessions: SessionData[];
    messageCount: number;
    weeklyData: WeeklyData[];
    weekRange: string;
  }>({
    queryKey: ["/api/speech/progress", selectedWeekOffset],
    queryFn: async () => {
      await new Promise((res) => setTimeout(res, 300));
      
      // Calculate current week range
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (selectedWeekOffset * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      const weekRange = `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;
      
      return {
        progress: {
          overallAccuracy: 88,
          sessionsCompleted: 12,
          totalPracticeTime: 180,
          currentStreak: 5,
          longestStreak: 10,
          achievements: ["First Session", "Accuracy 80%", "5-Day Streak"],
          level: 3,
          weeklyGoal: 5,
          thisWeekSessions: selectedWeekOffset === 0 ? 3 : 5
        },
        recentSessions: [
          {
            id: "1",
            sessionType: "pronunciation",
            accuracyScore: 92,
            wordsCompleted: 18,
            createdAt: "2025-10-04T14:30:00Z",
          },
          {
            id: "2",
            sessionType: "fluency",
            accuracyScore: 85,
            wordsCompleted: 24,
            createdAt: "2025-10-03T10:15:00Z",
          },
          {
            id: "3",
            sessionType: "vocabulary",
            accuracyScore: 90,
            wordsCompleted: 16,
            createdAt: "2025-10-02T16:45:00Z",
          }
        ],
        messageCount: 45,
        weeklyData: [
          { day: 'Mon', sessions: 1, accuracy: 88, date: '10/30' },
          { day: 'Tue', sessions: 2, accuracy: 92, date: '10/31' },
          { day: 'Wed', sessions: 0, accuracy: 0, date: '11/01' },
          { day: 'Thu', sessions: 1, accuracy: 85, date: '11/02' },
          { day: 'Fri', sessions: 1, accuracy: 90, date: '11/03' },
          { day: 'Sat', sessions: 0, accuracy: 0, date: '11/04' },
          { day: 'Sun', sessions: 0, accuracy: 0, date: '11/05' }
        ],
        weekRange
      };
    },
    enabled: !!isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Failed to load progress data.
      </div>
    );
  }

  const progress = progressData?.progress;
  const weeklyGoalProgress = progress ? Math.min((progress.thisWeekSessions / progress.weeklyGoal) * 100, 100) : 0;
  const practiceHours = progress ? Math.floor(progress.totalPracticeTime / 60) : 0;
  const practiceMinutes = progress ? progress.totalPracticeTime % 60 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)} 
        currentPage="progress"
      />

      {/* Main Content */}
      <main className="ml-20 w-full">
        {/* Top controls (right) */}
        <PageHeader className="flex justify-end items-center gap-4 px-5 py-5" />

        {/* Date pager pill — Enhanced with better navigation */}
        <div className="px-5">
          <div className="mx-auto max-w-[600px]">
            <div className="mx-auto h-11 rounded-full bg-neutral-100 dark:bg-muted/30 flex items-center justify-between px-3">
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-[15px] font-medium tracking-tight select-none">
                {progressData?.weekRange || "Loading..."}
              </span>
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                disabled={selectedWeekOffset >= 0}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50"
                aria-label="Next week"
              >
                <ChevronRight className="w-4.5 h-4.5" />
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
                onClick={() => setLocation('/speech-therapy')}
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Current Streak */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">STREAK</span>
                </div>
                <div className="text-2xl font-bold">
                  {progress?.currentStreak || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {progress?.currentStreak === 1 ? 'day' : 'days'}
                </div>
              </div>

              {/* Overall Accuracy */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">ACCURACY</span>
                </div>
                <div className="text-2xl font-bold">
                  {progress?.overallAccuracy || 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  overall
                </div>
              </div>

              {/* Practice Time */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">TIME</span>
                </div>
                <div className="text-2xl font-bold">
                  {practiceHours}h{practiceMinutes > 0 ? ` ${practiceMinutes}m` : ''}
                </div>
                <div className="text-xs text-muted-foreground">
                  total
                </div>
              </div>

              {/* Level */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">LEVEL</span>
                </div>
                <div className="text-2xl font-bold">
                  {progress?.level || 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  current
                </div>
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                daily activity
              </h3>
              <div className="space-y-3">
                {progressData?.weeklyData.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 text-xs font-medium text-muted-foreground">
                      {day.day}
                    </div>
                    <div className="w-12 text-xs text-muted-foreground">
                      {day.date}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                      <div 
                        className="bg-[#F5B82E] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${day.sessions ? Math.min((day.sessions / 3) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs text-right">
                      {day.sessions > 0 ? `${day.sessions} session${day.sessions > 1 ? 's' : ''}` : 'rest'}
                    </div>
                    {day.accuracy > 0 && (
                      <div className="w-12 text-xs text-muted-foreground text-right">
                        {day.accuracy}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                recent sessions
              </h3>
              <div className="space-y-3">
                {progressData?.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-sm font-medium capitalize">{session.sessionType}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.wordsCompleted} words • {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#F5B82E]">
                      {session.accuracyScore}%
                    </div>
                  </div>
                ))}
              </div>
              
              {progressData?.recentSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No sessions this week yet</p>
                  <button 
                    onClick={() => setLocation('/speech-therapy')}
                    className="text-[#F5B82E] text-sm hover:underline mt-2"
                  >
                    Start your first session →
                  </button>
                </div>
              )}
            </div>
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