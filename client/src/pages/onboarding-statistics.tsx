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
    <div className="min-h-screen bg-background text-foreground flex child-dashboard-no-zoom">
      <SharedSidebar currentPage="onboarding-stats" />
      
      <main className="ml-20 w-full child-dashboard-container">
        <PageHeader className="flex justify-end items-center gap-4 px-4 sm:px-5 py-4 sm:py-5" />
        
        <div className="px-5 pt-9">
          <div className="mx-auto max-w-4xl">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-[26px] font-bold">
                  onboarding statistics
                </h1>
                <p className="text-[15px] text-muted-foreground mt-1">
                  Overview of all assessment data and statistics
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center gap-2 bg-[#F5B82E] text-black px-5 py-2.5 rounded-lg text-[15px] font-semibold hover:opacity-90 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">TOTAL</span>
                </div>
                <div className="text-2xl font-bold">
                  {statistics.overview.total}
                </div>
                <div className="text-xs text-muted-foreground">
                  onboardings
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">COMPLETED</span>
                </div>
                <div className="text-2xl font-bold">
                  {statistics.overview.completed}
                </div>
                <div className="text-xs text-muted-foreground">
                  {statistics.overview.completionRate}% rate
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">IN PROGRESS</span>
                </div>
                <div className="text-2xl font-bold">
                  {statistics.overview.inProgress}
                </div>
                <div className="text-xs text-muted-foreground">
                  avg step {statistics.overview.averageStep}
                </div>
              </div>

              <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">THERAPY</span>
                </div>
                <div className="text-2xl font-bold">
                  {statistics.therapy.seekingTherapy}
                </div>
                <div className="text-xs text-muted-foreground">
                  {statistics.therapy.percentage}% seeking
                </div>
              </div>
            </div>

            {/* Demographics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Gender Distribution */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  gender distribution
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-xs font-medium text-muted-foreground">Girls</div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                      <div 
                        className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(statistics.demographics.gender.girl / statistics.overview.total) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="w-12 text-xs text-right font-bold text-pink-500">
                      {statistics.demographics.gender.girl}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-xs font-medium text-muted-foreground">Boys</div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(statistics.demographics.gender.boy / statistics.overview.total) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="w-12 text-xs text-right font-bold text-blue-500">
                      {statistics.demographics.gender.boy}
                    </div>
                  </div>

                  {statistics.demographics.gender.unspecified > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-xs font-medium text-muted-foreground">Other</div>
                      <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(statistics.demographics.gender.unspecified / statistics.overview.total) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right font-bold text-gray-500">
                        {statistics.demographics.gender.unspecified}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Completion */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  assessment completion
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Hearing</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">{statistics.assessments.hearing}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Pragmatics</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">{statistics.assessments.pragmatics}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Play</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">{statistics.assessments.play}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Comprehension</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5B82E]">{statistics.assessments.comprehension}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Interests */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                top interests
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestsList.map(([interest, count], index) => (
                  <div
                    key={interest}
                    className="p-3 bg-muted/30 rounded-lg text-center"
                  >
                    <div className="text-xl font-bold text-[#F5B82E] mb-1">{count}</div>
                    <div className="text-xs font-medium capitalize">
                      {interest}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocabulary Distribution */}
            {vocabularyList.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  vocabulary levels
                </h3>
                
                <div className="space-y-3">
                  {vocabularyList.map(([level, count]) => (
                    <div key={level} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium text-muted-foreground capitalize">
                        {level.replace(/-/g, ' ')}
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="bg-[#F5B82E] h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(count / statistics.overview.total) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right font-bold text-[#F5B82E]">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
