import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Users,
  Shield,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  BarChart3,
  LineChart,
  Calendar,
  RefreshCw
} from 'lucide-react';
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

interface ProgressChartProps {
  data: LongTermProgress;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <LineChart className="w-5 h-5 mr-2 text-fluenti-primary" />
          Progress Trend
        </h3>
        <span className="text-sm text-muted-foreground">
          Last {data?.entries?.length || 0} sessions
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Date</span>
          <span>Mood Score</span>
          <span>Crisis Level</span>
          <span>Patterns</span>
        </div>
        
        {(data?.entries || []).length > 0 ? (
          (data.entries || []).slice(0, 10).map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg"
            >
              <span className="text-sm font-medium text-foreground">
                {new Date(entry.date).toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  entry.moodScore ? getScoreColor(entry.moodScore) : 'bg-gray-400'
                }`} />
                <span className="text-sm text-foreground">
                  {entry.moodScore || 'N/A'}
                </span>
              </div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                entry.crisisLevel === 'low' ? 'bg-green-100 text-green-800' :
                entry.crisisLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {entry.crisisLevel}
              </span>
              <span className="text-sm text-foreground font-medium">
                {entry.patternsIdentified || 0}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No progress data available yet</p>
            <p className="text-sm">Start a therapy session to track your progress</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface InsightsSectionProps {
  profile: PsychologicalProfile;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ profile }) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
      <Lightbulb className="w-5 h-5 mr-2 text-fluenti-primary" />
      Psychological Insights
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Core Patterns */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center">
          <Target className="w-4 h-4 mr-2 text-fluenti-primary" />
          Core Patterns ({profile?.insights?.corePatterns?.count || 0})
        </h4>
        <div className="space-y-2">
          {(profile?.insights?.corePatterns?.patterns || []).slice(0, 3).map((pattern, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{pattern}</span>
            </div>
          ))}
          {(!profile?.insights?.corePatterns?.patterns || profile.insights.corePatterns.patterns.length === 0) && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">No patterns identified yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Coping Mechanisms */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center">
          <Shield className="w-4 h-4 mr-2 text-fluenti-primary" />
          Effective Coping ({profile?.insights?.copingMechanisms?.count || 0})
        </h4>
        <div className="space-y-2">
          {(profile?.insights?.copingMechanisms?.effective || []).slice(0, 3).map((mechanism, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{mechanism}</span>
            </div>
          ))}
          {(!profile?.insights?.copingMechanisms?.effective || profile.insights.copingMechanisms.effective.length === 0) && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">No effective coping mechanisms identified yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Cultural Context */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center">
          <Users className="w-4 h-4 mr-2 text-fluenti-primary" />
          Cultural Context
        </h4>
        <div className="space-y-2">
          {profile?.insights?.culturalContext?.identified ? (
            (profile.insights.culturalContext.aspects || []).slice(0, 3).map((aspect, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{aspect}</span>
              </div>
            ))
          ) : (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                No specific cultural context identified yet
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trauma-Informed Indicators */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center">
          <Shield className="w-4 h-4 mr-2 text-fluenti-primary" />
          Trauma-Informed Care
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Indicators Found</span>
            <span className="text-sm font-medium text-foreground">
              {profile?.insights?.traumaInformed?.indicators || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Approach Needed</span>
            <span className={`text-sm font-medium ${
              profile?.insights?.traumaInformed?.approach_needed 
                ? 'text-orange-500' 
                : 'text-green-500'
            }`}>
              {profile?.insights?.traumaInformed?.approach_needed ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Core Patterns"
              value={profile?.insights?.corePatterns?.count || 0}
              icon={Target}
              description="Identified behavioral patterns"
              colorClass="text-blue-500"
            />
            <StatCard
              title="Progress Trend"
              value={profile?.insights?.progressTracking?.trend || 'Unknown'}
              icon={TrendingUp}
              description={`Momentum: ${profile?.insights?.progressTracking?.momentum || 0}%`}
              trend={
                profile?.insights?.progressTracking?.trend === 'improving' ? 'up' :
                profile?.insights?.progressTracking?.trend === 'declining' ? 'down' : 'stable'
              }
              colorClass="text-green-500"
            />
            <StatCard
              title="Cultural Context"
              value={profile?.insights?.culturalContext?.identified ? 'Identified' : 'Pending'}
              icon={Users}
              description={`${profile?.insights?.culturalContext?.aspects?.length || 0} aspects`}
              colorClass="text-purple-500"
            />
            <StatCard
              title="Resilience Factors"
              value={profile?.insights?.progressTracking?.resilience_factors || 0}
              icon={Shield}
              description="Protective elements"
              colorClass="text-teal-500"
            />
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Sessions"
              value={progress?.summary?.totalSessions || 0}
              icon={Calendar}
              description="Therapy sessions completed"
              colorClass="text-fluenti-primary"
            />
            <StatCard
              title="Average Mood"
              value={`${progress?.summary?.averageMood || 'N/A'}/10`}
              icon={Activity}
              description="Overall emotional state"
              trend={progress?.insights?.improvement ? 'up' : progress?.insights?.stable ? 'stable' : 'down'}
              colorClass="text-pink-500"
            />
            <StatCard
              title="Crisis Events"
              value={progress?.summary?.crisisEvents || 0}
              icon={AlertTriangle}
              description={progress?.summary?.timespan || 'No data'}
              colorClass="text-red-500"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progress Chart */}
            {progress && <ProgressChart data={progress} />}
            
            {/* Insights Section */}
            {profile && <InsightsSection profile={profile} />}
          </div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-fluenti-primary" />
              Care Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  profile?.recommendations?.culturally_informed ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-foreground">Culturally Informed Care</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  profile?.recommendations?.trauma_informed ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-foreground">Trauma-Informed Approach</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  profile?.recommendations?.strengths_based ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-foreground">Strengths-Based Therapy</span>
              </div>
            </div>
          </motion.div>

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