import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Download,
  Heart,
  Brain,
  Gamepad2,
  Volume2,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import SharedSidebar from '@/components/layout/SharedSidebar';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStats {
  overview: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    averageStep: number;
  };
  demographics: {
    gender: {
      girl: number;
      boy: number;
      unspecified: number;
    };
    interests: Record<string, number>;
    vocabularyLevels: Record<string, number>;
  };
  therapy: {
    seekingTherapy: number;
    notSeekingTherapy: number;
    percentage: number;
  };
  assessments: {
    hearing: number;
    pragmatics: number;
    play: number;
    comprehension: number;
  };
}

export default function OnboardingStatistics() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<OnboardingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/onboarding/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/onboarding/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `onboarding-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Data exported successfully'
        });
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const interestsList = Object.entries(statistics.demographics.interests)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const vocabularyList = Object.entries(statistics.demographics.vocabularyLevels);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SharedSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <PageHeader />
        
        <div className="p-6 space-y-6">
          {/* Header with Export Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Onboarding Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Overview of all assessment data and statistics
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5B82E] text-white rounded-lg hover:bg-[#e5a820] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </motion.button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.overview.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Onboardings
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.overview.completed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completion Rate: {statistics.overview.completionRate}%
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.overview.inProgress}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Average Step: {statistics.overview.averageStep}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.therapy.seekingTherapy}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Seeking Help</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statistics.therapy.percentage}% seeking therapy
              </div>
            </motion.div>
          </div>

          {/* Demographics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-6 h-6 text-[#F5B82E]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gender Distribution
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Girls</span>
                    <span className="text-sm font-bold text-pink-600">{statistics.demographics.gender.girl}</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(statistics.demographics.gender.girl / statistics.overview.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Boys</span>
                    <span className="text-sm font-bold text-blue-600">{statistics.demographics.gender.boy}</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(statistics.demographics.gender.boy / statistics.overview.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {statistics.demographics.gender.unspecified > 0 && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unspecified</span>
                      <span className="text-sm font-bold text-gray-600">{statistics.demographics.gender.unspecified}</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(statistics.demographics.gender.unspecified / statistics.overview.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Assessment Completion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-[#F5B82E]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Assessment Completion
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Hearing</span>
                  </div>
                  <span className="font-bold text-blue-600">{statistics.assessments.hearing}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Pragmatics</span>
                  </div>
                  <span className="font-bold text-purple-600">{statistics.assessments.pragmatics}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Play</span>
                  </div>
                  <span className="font-bold text-green-600">{statistics.assessments.play}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Comprehension</span>
                  </div>
                  <span className="font-bold text-orange-600">{statistics.assessments.comprehension}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Interests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-[#F5B82E]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Top Interests
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interestsList.map(([interest, count], index) => (
                <div
                  key={interest}
                  className="p-4 bg-gradient-to-br from-[#F5B82E]/10 to-orange-100 dark:from-[#F5B82E]/20 dark:to-orange-900/20 rounded-xl text-center"
                >
                  <div className="text-2xl font-bold text-[#F5B82E] mb-1">{count}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {interest}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Vocabulary Distribution */}
          {vocabularyList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-[#F5B82E]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Vocabulary Levels
                </h2>
              </div>
              
              <div className="space-y-3">
                {vocabularyList.map(([level, count]) => (
                  <div key={level}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {level.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-[#F5B82E]">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#F5B82E] to-orange-400 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(count / statistics.overview.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
