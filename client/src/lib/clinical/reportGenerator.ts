/**
 * Clinical Report Generator
 * 
 * Generates clinical-grade therapeutic reports from session data
 * Provides evidence-based recommendations and progress tracking
 * Suitable for therapist review and clinical documentation
 */

export interface TherapeuticSession {
  userId: string;
  sessionId: string;
  gameId: number;
  game_category: string;
  timestamp: Date;
  startTime: Date;
  endTime: Date;
  accuracy: number;
  score: number;
  therapeutic_data?: {
    phonemeAwareness?: number;
    socialAccuracy?: number;
    articulationScore?: number;
    languageScore?: number;
    fluencyScore?: number;
    correctResponses?: number;
    incorrectResponses?: number;
    averageResponseTime?: number;
    taskBreakdown?: any;
  };
}

export interface TherapeuticArea {
  avgAccuracy: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  sessionCount: number;
  recentSessions?: number[];
  lastSessionDate?: Date;
}

export interface ClinicalReport {
  patient_id: string;
  assessment_period: {
    start: Date;
    end: Date;
    duration_days: number;
  };
  therapeutic_areas: {
    phonological_awareness: TherapeuticArea | null;
    articulation: TherapeuticArea | null;
    social_communication: TherapeuticArea | null;
    language_comprehension: TherapeuticArea | null;
    fluency: TherapeuticArea | null;
  };
  overall_metrics: {
    total_sessions: number;
    total_practice_time_minutes: number;
    average_accuracy: number;
    improvement_rate: number;
    consistency_score: number;
  };
  recommendations: string[];
  evidence_level: 'clinical-grade' | 'preliminary' | 'insufficient';
  generated_at: Date;
}

export class ClinicalReportGenerator {
  /**
   * Generate a comprehensive therapeutic report for a patient
   * @param userId - Patient identifier
   * @param sessions - Array of therapeutic session data
   * @returns Clinical report with progress metrics and recommendations
   */
  static generateTherapeuticReport(userId: string, sessions: TherapeuticSession[]): ClinicalReport {
    if (!sessions || sessions.length === 0) {
      return this.generateEmptyReport(userId);
    }

    // Sort sessions by timestamp
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const report: ClinicalReport = {
      patient_id: userId,
      assessment_period: this.calculateAssessmentPeriod(sortedSessions),
      therapeutic_areas: {
        phonological_awareness: this.calculateProgressMetric(sortedSessions, 'phonological'),
        articulation: this.calculateProgressMetric(sortedSessions, 'articulation'),
        social_communication: this.calculateProgressMetric(sortedSessions, 'pragmatic'),
        language_comprehension: this.calculateProgressMetric(sortedSessions, 'language'),
        fluency: this.calculateProgressMetric(sortedSessions, 'fluency')
      },
      overall_metrics: this.calculateOverallMetrics(sortedSessions),
      recommendations: this.generateRecommendations(sortedSessions),
      evidence_level: this.determineEvidenceLevel(sortedSessions.length),
      generated_at: new Date()
    };
    
    return report;
  }

  /**
   * Calculate assessment period from session dates
   */
  private static calculateAssessmentPeriod(sessions: TherapeuticSession[]) {
    const startDate = new Date(sessions[0].timestamp);
    const endDate = new Date(sessions[sessions.length - 1].timestamp);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    return {
      start: startDate,
      end: endDate,
      duration_days: durationDays
    };
  }

  /**
   * Calculate progress metrics for a specific therapeutic category
   * @param sessions - All therapeutic sessions
   * @param category - Therapeutic category to analyze
   * @returns Progress metrics or null if no data
   */
  private static calculateProgressMetric(
    sessions: TherapeuticSession[], 
    category: string
  ): TherapeuticArea | null {
    const categorySessions = sessions.filter(s => s.game_category === category);
    
    if (categorySessions.length === 0) {
      return null;
    }
    
    // Calculate average accuracy
    const avgAccuracy = categorySessions.reduce((sum, s) => sum + s.accuracy, 0) / categorySessions.length;
    
    // Calculate trend
    const trend = this.calculateTrend(categorySessions);
    
    // Get recent session scores
    const recentSessions = categorySessions
      .slice(-5)
      .map(s => s.accuracy);
    
    // Get last session date
    const lastSessionDate = new Date(categorySessions[categorySessions.length - 1].timestamp);
    
    return { 
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      trend, 
      sessionCount: categorySessions.length,
      recentSessions,
      lastSessionDate
    };
  }
  
  /**
   * Calculate improvement trend from session data
   * @param sessions - Sessions for a specific category
   * @returns Trend classification
   */
  private static calculateTrend(
    sessions: TherapeuticSession[]
  ): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
    if (sessions.length < 2) {
      return 'insufficient_data';
    }
    
    // Compare recent sessions (last 3) with earlier sessions (first 3)
    const recentCount = Math.min(3, Math.floor(sessions.length / 2));
    const recent = sessions.slice(-recentCount);
    const earlier = sessions.slice(0, recentCount);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s.accuracy, 0) / earlier.length;
    
    const difference = recentAvg - earlierAvg;
    
    // Threshold of 5% change to determine trend
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate overall metrics across all sessions
   */
  private static calculateOverallMetrics(sessions: TherapeuticSession[]) {
    const totalSessions = sessions.length;
    
    // Calculate total practice time in minutes
    const totalPracticeTimeMs = sessions.reduce((sum, s) => {
      const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
      return sum + duration;
    }, 0);
    const totalPracticeTimeMinutes = Math.round(totalPracticeTimeMs / (1000 * 60));
    
    // Calculate average accuracy
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    
    // Calculate improvement rate (first vs last session)
    const improvementRate = totalSessions >= 2
      ? sessions[sessions.length - 1].accuracy - sessions[0].accuracy
      : 0;
    
    // Calculate consistency score (based on variance)
    const variance = this.calculateVariance(sessions.map(s => s.accuracy));
    const consistencyScore = Math.max(0, 100 - variance);
    
    return {
      total_sessions: totalSessions,
      total_practice_time_minutes: totalPracticeTimeMinutes,
      average_accuracy: Math.round(averageAccuracy * 100) / 100,
      improvement_rate: Math.round(improvementRate * 100) / 100,
      consistency_score: Math.round(consistencyScore * 100) / 100
    };
  }

  /**
   * Calculate variance for consistency score
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Generate AI-powered therapeutic recommendations
   * @param sessions - All therapeutic sessions
   * @returns Array of clinical recommendations
   */
  private static generateRecommendations(sessions: TherapeuticSession[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze by category
    const categories = ['phonological', 'articulation', 'pragmatic', 'language', 'fluency'];
    
    categories.forEach(category => {
      const categorySessions = sessions.filter(s => s.game_category === category);
      
      if (categorySessions.length === 0) {
        // Recommend starting this category
        recommendations.push(
          `Consider introducing ${this.getCategoryDisplayName(category)} exercises to provide comprehensive therapy coverage`
        );
      } else {
        const avgAccuracy = categorySessions.reduce((sum, s) => sum + s.accuracy, 0) / categorySessions.length;
        const trend = this.calculateTrend(categorySessions);
        
        if (avgAccuracy < 70) {
          // Low performance - recommend increased practice
          recommendations.push(
            `Increase ${this.getCategoryDisplayName(category)} practice to 4-5 sessions per week to improve proficiency`
          );
        } else if (avgAccuracy > 90 && trend === 'stable') {
          // High performance - recommend advancing
          recommendations.push(
            `Excellent progress in ${this.getCategoryDisplayName(category)}. Consider advancing to more challenging exercises`
          );
        } else if (trend === 'declining') {
          // Declining performance - recommend review
          recommendations.push(
            `Review foundational ${this.getCategoryDisplayName(category)} concepts as recent performance shows decline`
          );
        } else if (trend === 'improving') {
          // Improving - encourage continuation
          recommendations.push(
            `Continue current ${this.getCategoryDisplayName(category)} routine - showing positive improvement trend`
          );
        }
      }
    });
    
    // Session frequency recommendations
    const totalSessions = sessions.length;
    const assessmentPeriod = this.calculateAssessmentPeriod(sessions);
    const sessionsPerWeek = (totalSessions / assessmentPeriod.duration_days) * 7;
    
    if (sessionsPerWeek < 3) {
      recommendations.push(
        'Increase therapy session frequency to at least 3-4 sessions per week for optimal progress'
      );
    } else if (sessionsPerWeek > 6) {
      recommendations.push(
        'Maintain current high engagement level while ensuring adequate rest periods between sessions'
      );
    }
    
    // Phoneme-specific recommendations (if phonological data available)
    const phonologicalSessions = sessions.filter(s => s.game_category === 'phonological');
    if (phonologicalSessions.length > 0) {
      recommendations.push(
        'Focus on specific phonemes: /r/, /s/, /th/ based on common developmental patterns'
      );
    }
    
    // Social communication recommendations (if pragmatic data available)
    const pragmaticSessions = sessions.filter(s => s.game_category === 'pragmatic');
    if (pragmaticSessions.length > 0) {
      recommendations.push(
        'Incorporate peer interactions and group activities to enhance social communication skills'
      );
    }
    
    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        'Continue regular therapeutic practice and monitor progress over time'
      );
    }
    
    return recommendations.slice(0, 6); // Limit to top 6 recommendations
  }

  /**
   * Get display name for therapeutic category
   */
  private static getCategoryDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      'phonological': 'phonological awareness',
      'articulation': 'articulation',
      'pragmatic': 'social communication',
      'language': 'language comprehension',
      'fluency': 'fluency'
    };
    
    return displayNames[category] || category;
  }

  /**
   * Determine evidence level based on data quantity
   */
  private static determineEvidenceLevel(sessionCount: number): 'clinical-grade' | 'preliminary' | 'insufficient' {
    if (sessionCount >= 10) return 'clinical-grade';
    if (sessionCount >= 5) return 'preliminary';
    return 'insufficient';
  }

  /**
   * Generate empty report for patients with no session data
   */
  private static generateEmptyReport(userId: string): ClinicalReport {
    return {
      patient_id: userId,
      assessment_period: {
        start: new Date(),
        end: new Date(),
        duration_days: 0
      },
      therapeutic_areas: {
        phonological_awareness: null,
        articulation: null,
        social_communication: null,
        language_comprehension: null,
        fluency: null
      },
      overall_metrics: {
        total_sessions: 0,
        total_practice_time_minutes: 0,
        average_accuracy: 0,
        improvement_rate: 0,
        consistency_score: 0
      },
      recommendations: [
        'Begin therapeutic assessment with baseline phonological awareness exercises',
        'Establish regular practice schedule (3-4 sessions per week)',
        'Track progress across multiple therapeutic domains'
      ],
      evidence_level: 'insufficient',
      generated_at: new Date()
    };
  }

  /**
   * Export report as formatted string for clinical documentation
   */
  static exportReportAsText(report: ClinicalReport): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('THERAPEUTIC PROGRESS REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push(`Patient ID: ${report.patient_id}`);
    lines.push(`Report Generated: ${report.generated_at.toLocaleDateString()}`);
    lines.push(`Evidence Level: ${report.evidence_level.toUpperCase()}`);
    lines.push('');
    
    lines.push('ASSESSMENT PERIOD:');
    lines.push(`  Start Date: ${report.assessment_period.start.toLocaleDateString()}`);
    lines.push(`  End Date: ${report.assessment_period.end.toLocaleDateString()}`);
    lines.push(`  Duration: ${report.assessment_period.duration_days} days`);
    lines.push('');
    
    lines.push('OVERALL METRICS:');
    lines.push(`  Total Sessions: ${report.overall_metrics.total_sessions}`);
    lines.push(`  Total Practice Time: ${report.overall_metrics.total_practice_time_minutes} minutes`);
    lines.push(`  Average Accuracy: ${report.overall_metrics.average_accuracy}%`);
    lines.push(`  Improvement Rate: ${report.overall_metrics.improvement_rate > 0 ? '+' : ''}${report.overall_metrics.improvement_rate}%`);
    lines.push(`  Consistency Score: ${report.overall_metrics.consistency_score}%`);
    lines.push('');
    
    lines.push('THERAPEUTIC AREAS:');
    Object.entries(report.therapeutic_areas).forEach(([area, metrics]) => {
      const displayName = area.replace(/_/g, ' ').toUpperCase();
      if (metrics) {
        lines.push(`  ${displayName}:`);
        lines.push(`    - Average Accuracy: ${metrics.avgAccuracy}%`);
        lines.push(`    - Trend: ${metrics.trend.toUpperCase()}`);
        lines.push(`    - Sessions Completed: ${metrics.sessionCount}`);
      } else {
        lines.push(`  ${displayName}: No data available`);
      }
    });
    lines.push('');
    
    lines.push('CLINICAL RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      lines.push(`  ${index + 1}. ${rec}`);
    });
    lines.push('');
    
    lines.push('='.repeat(60));
    lines.push('End of Report');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }

  /**
   * Export report as JSON for API integration
   */
  static exportReportAsJSON(report: ClinicalReport): string {
    return JSON.stringify(report, null, 2);
  }
}
