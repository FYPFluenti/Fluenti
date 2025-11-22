import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  Calendar,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import PageHeader from '@/components/layout/PageHeader';
import FeedbackModal from '@/components/layout/FeedbackModel';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/auth';
import {
  PsychologicalProfileService,
  type PsychologicalProfile,
  type LongTermProgress
} from '@/services/psychologicalProfileService';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  colorClass = "text-fluenti-primary"
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center space-x-1">
        <TrendingUp className={`w-4 h-4 ${
          trend === 'up' ? 'text-green-500' :
          trend === 'down' ? 'text-red-500' : 'text-yellow-500'
        }`} />
        <span className={`text-sm ${
          trend === 'up' ? 'text-green-500' :
          trend === 'down' ? 'text-red-500' : 'text-yellow-500'
        }`}>
          {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        </span>
      </div>
    )}
  </motion.div>
);

interface MoodTrendChartProps {
  data: LongTermProgress;
}

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ data }) => {
  const chartData = (data?.entries || [])
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry.moodScore || null,
      fullDate: entry.date
    }))
    .filter(item => item.mood !== null)
    .slice(-30); // Last 30 data points

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Activity className="w-5 h-5 mr-2 text-fluenti-primary" />
            Mood Trend
          </h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No mood data available yet</p>
          <p className="text-sm">Start therapy sessions to track your mood</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Activity className="w-5 h-5 mr-2 text-fluenti-primary" />
          Mood Trend Over Time
        </h3>
        <span className="text-sm text-muted-foreground">
          {chartData.length} data points
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: '800px', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 10]}
                label={{ value: 'Mood Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}/10`, 'Mood Score']}
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

interface CrisisEventsChartProps {
  data: LongTermProgress;
}

const CrisisEventsChart: React.FC<CrisisEventsChartProps> = ({ data }) => {
  const chartData = (data?.entries || [])
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      events: entry.crisisEvents || 0,
      fullDate: entry.date
    }))
    .slice(-30); // Last 30 data points

  if (chartData.length === 0 || chartData.every(item => item.events === 0)) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-fluenti-primary" />
            Crisis Events
          </h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500 opacity-50" />
          <p>No crisis events recorded</p>
          <p className="text-sm">Keep up the great work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-fluenti-primary" />
          Crisis Events Over Time
        </h3>
        <span className="text-sm text-muted-foreground">
          Total: {chartData.reduce((sum, item) => sum + item.events, 0)} events
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: '800px', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis label={{ value: 'Events', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="events" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

interface InsightsSectionProps {
  profile: PsychologicalProfile;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ profile }) => {
  const corePatterns = profile?.insights?.corePatterns?.patterns || [];
  const copingMechanisms = profile?.insights?.copingMechanisms?.effective || [];
  
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-fluenti-primary" />
        Key Insights
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Patterns */}
        {corePatterns.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center">
              <Target className="w-4 h-4 mr-2 text-fluenti-primary" />
              Behavioral Patterns
            </h4>
            <div className="space-y-2">
              {corePatterns.slice(0, 5).map((pattern, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground capitalize">{pattern.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coping Mechanisms */}
        {copingMechanisms.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center">
              <Shield className="w-4 h-4 mr-2 text-fluenti-primary" />
              Effective Coping Strategies
            </h4>
            <div className="space-y-2">
              {copingMechanisms.slice(0, 5).map((mechanism, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground capitalize">{mechanism.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {corePatterns.length === 0 && copingMechanisms.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>Continue your therapy sessions to generate insights</p>
        </div>
      )}
    </div>
  );
};

export default function PsychologicalInsights() {
  const { user, isAuthenticated } = useAuth() as {
    user: User;
    isAuthenticated: boolean;
  };
  const [profile, setProfile] = useState<PsychologicalProfile | null>(null);
  const [progress, setProgress] = useState<LongTermProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setError(null);
      const [profileData, progressData] = await Promise.all([
        PsychologicalProfileService.getProfile(user.id),
        PsychologicalProfileService.getProgress(user.id, 30)
      ]);
      
      setProfile(profileData);
      setProgress(progressData);
    } catch (err) {
      console.error('Error loading psychological data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <SharedSidebarEmotional 
          currentPage="insights" 
          onFeedbackOpen={() => setShowFeedback(true)}
        />
        <main className="flex-1 ml-20 p-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-fluenti-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <SharedSidebarEmotional 
          currentPage="insights" 
          onFeedbackOpen={() => setShowFeedback(true)}
        />
        <main className="flex-1 ml-20 p-8">
          <div className="flex items-center justify-center h-64 text-center">
            <div className="space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Error Loading Data</h3>
                <p className="text-muted-foreground">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-fluenti-primary text-white rounded-lg hover:bg-fluenti-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Only show "No Data Available" if we're not loading and don't have data
  if (!loading && (!profile || !progress)) {
    return (
      <div className="flex min-h-screen bg-background">
        <SharedSidebarEmotional 
          currentPage="insights" 
          onFeedbackOpen={() => setShowFeedback(true)}
        />
        <main className="flex-1 ml-20 p-8">
          <div className="flex items-center justify-center h-64 text-center">
            <div className="space-y-4">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No Data Available</h3>
                <p className="text-muted-foreground">
                  Start a therapy session to generate psychological insights
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-fluenti-primary text-white rounded-lg hover:bg-fluenti-primary/90 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SharedSidebarEmotional 
        currentPage="insights" 
        onFeedbackOpen={() => setShowFeedback(true)}
      />
      
      <main className="flex-1 ml-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-fluenti-primary" />
                <h1 className="text-2xl font-bold text-foreground">Psychological Insights</h1>
              </div>
              <p className="text-muted-foreground">Track your mental health patterns and progress</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-fluenti-primary text-white rounded-lg hover:bg-fluenti-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sessions"
              value={progress?.summary?.totalSessions || 0}
              icon={Calendar}
              description="All conversations tracked"
              colorClass="text-fluenti-primary"
            />
            <StatCard
              title="Average Mood"
              value={`${progress?.summary?.averageMood?.toFixed(1) || 'N/A'}/10`}
              icon={Activity}
              description="Overall emotional state"
              trend={progress?.insights?.improvement ? 'up' : progress?.insights?.stable ? 'stable' : 'down'}
              colorClass="text-pink-500"
            />
            <StatCard
              title="Crisis Events"
              value={progress?.summary?.crisisEvents || 0}
              icon={AlertTriangle}
              description={`Last ${progress?.summary?.timespan || '30 days'}`}
              colorClass="text-red-500"
            />
            <StatCard
              title="Core Patterns"
              value={profile?.insights?.corePatterns?.count || 0}
              icon={Target}
              description="Behavioral patterns identified"
              colorClass="text-blue-500"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mood Trend Chart */}
            {progress && <MoodTrendChart data={progress} />}
            
            {/* Crisis Events Chart */}
            {progress && <CrisisEventsChart data={progress} />}
          </div>
          
          {/* Insights Section */}
          {profile && <InsightsSection profile={profile} />}


          {/* Last Updated */}
          {profile?.lastUpdated && (
            <div className="text-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-2" />
              Last updated: {new Date(profile.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}