// Service for interacting with psychological profiling APIs
import { buildApiUrl } from '@/lib/apiUtils';

export interface PsychologicalProfile {
  userId: string;
  profileExists: boolean;
  lastUpdated: string;
  insights: {
    corePatterns: {
      count: number;
      patterns: string[];
    };
    cognitivePatterns: {
      count: number;
      patterns: string[];
    };
    copingMechanisms: {
      count: number;
      effective: string[];
    };
    // culturalContext removed as requested
    traumaInformed: {
      indicators: number;
      approach_needed: boolean;
    };
    progressTracking: {
      trend: string;
      momentum: number;
      resilience_factors: number;
    };
  };
  recommendations: {
    // culturally_informed removed as requested
    trauma_informed: boolean;
    strengths_based: boolean;
  };
}

export interface LongTermProgress {
  entries: ProgressEntry[];
  summary: {
    totalSessions: number;
    averageMood: number;
    crisisEvents: number;
    currentTrend: string;
    timespan: string;
  };
  insights: {
    improvement: boolean;
    stable: boolean;
    needsAttention: boolean;
  };
}

export interface ProgressEntry {
  date: string;
  crisisLevel: string;
  moodScore?: number;
  patternsIdentified: number;
  qualityIndicators: Record<string, any>;
  riskTrend: string;
  resilienceIndicators: string[];
}

export class PsychologicalProfileService {
  /**
   * Get psychological profile for a user
   */
  static async getProfile(userId: string): Promise<PsychologicalProfile> {
    try {
      const response = await fetch(buildApiUrl(`/api/therapy/psychological-profile?userId=${encodeURIComponent(userId)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🧠 Psychological Profile API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch psychological profile');
      }

      // Return profile with safe defaults
      return {
        userId: data.profile?.userId || userId,
        profileExists: data.profile?.profileExists || false,
        lastUpdated: data.profile?.lastUpdated || new Date().toISOString(),
        insights: {
          corePatterns: {
            count: data.profile?.insights?.corePatterns?.count || 0,
            patterns: data.profile?.insights?.corePatterns?.patterns || []
          },
          cognitivePatterns: {
            count: data.profile?.insights?.cognitivePatterns?.count || 0,
            patterns: data.profile?.insights?.cognitivePatterns?.patterns || []
          },
          copingMechanisms: {
            count: data.profile?.insights?.copingMechanisms?.count || 0,
            effective: data.profile?.insights?.copingMechanisms?.effective || []
          },
          // culturalContext removed as requested
          traumaInformed: {
            indicators: data.profile?.insights?.traumaInformed?.indicators || 0,
            approach_needed: data.profile?.insights?.traumaInformed?.approach_needed || false
          },
          progressTracking: {
            trend: data.profile?.insights?.progressTracking?.trend || 'unknown',
            momentum: data.profile?.insights?.progressTracking?.momentum || 0,
            resilience_factors: data.profile?.insights?.progressTracking?.resilience_factors || 0
          }
        },
        recommendations: {
          // culturally_informed removed as requested
          trauma_informed: data.profile?.recommendations?.trauma_informed || false,
          strengths_based: data.profile?.recommendations?.strengths_based || false
        }
      };
    } catch (error) {
      console.error('Error fetching psychological profile:', error);
      throw error;
    }
  }

  /**
   * Get long-term progress for a user
   */
  static async getProgress(userId: string, days: number = 30): Promise<LongTermProgress> {
    try {
      const response = await fetch(
        buildApiUrl(`/api/therapy/long-term-progress?userId=${encodeURIComponent(userId)}&days=${days}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Progress Data API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch progress data');
      }

      // Return progress with safe defaults
      return {
        entries: data.progress?.entries || [],
        summary: {
          totalSessions: data.progress?.summary?.totalSessions || 0,
          averageMood: data.progress?.summary?.averageMood || 0,
          crisisEvents: data.progress?.summary?.crisisEvents || 0,
          currentTrend: data.progress?.summary?.currentTrend || 'unknown',
          timespan: data.progress?.summary?.timespan || '0 days'
        },
        insights: {
          improvement: data.progress?.insights?.improvement || false,
          stable: data.progress?.insights?.stable || false,
          needsAttention: data.progress?.insights?.needsAttention || false
        }
      };
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  }

  /**
   * Get therapy session history for context
   */
  static async getSessionHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(buildApiUrl(`/api/therapy/sessions?userId=${encodeURIComponent(userId)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  }
}