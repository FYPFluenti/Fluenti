import { TherapeuticGame, GameSession, UserProgress } from '@/types/games/therapeutic';

export class TherapeuticGameEngine {
  static calculateAccuracy(responses: any[]): number {
    if (responses.length === 0) return 0;
    const correctResponses = responses.filter(r => r.isCorrect).length;
    return (correctResponses / responses.length) * 100;
  }

  static calculateImprovementScore(category: string, accuracy: number): number {
    const baseScore = Math.floor(accuracy / 20);
    const categoryMultipliers = {
      'pragmatic': 1.5,
      'sensory': 1.4,
      'fluency': 1.3,
      'articulation': 1.2,
      'phonological': 1.1,
      'language': 1.0
    };
    
    const multiplier = categoryMultipliers[category as keyof typeof categoryMultipliers] || 1.0;
    return Math.min(5, Math.round(baseScore * multiplier));
  }

  static updateUserProgress(
    currentProgress: UserProgress, 
    session: GameSession, 
    game: TherapeuticGame
  ): UserProgress {
    const improvementScore = this.calculateImprovementScore(game.category, session.accuracy);
    const categoryKey = this.getCategoryProgressKey(game.category);
    
    return {
      ...currentProgress,
      [categoryKey]: Math.min(100, currentProgress[categoryKey as keyof UserProgress] as number + improvementScore),
      sessions_completed: currentProgress.sessions_completed + 1,
      lastSession: new Date(),
      totalPracticeTime: currentProgress.totalPracticeTime + this.calculateSessionDuration(session)
    };
  }

  static getCategoryProgressKey(category: string): string {
    const mapping: { [key: string]: string } = {
      'articulation': 'articulation_score',
      'phonological': 'phonological_awareness',
      'language': 'language_comprehension',
      'pragmatic': 'social_communication',
      'fluency': 'articulation_score',
      'sensory': 'social_communication'
    };
    return mapping[category] || 'articulation_score';
  }

  static calculateSessionDuration(session: GameSession): number {
    if (!session.endTime) return 0;
    return Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60); // minutes
  }

  static generateTherapeuticRecommendations(progress: UserProgress): string[] {
    const recommendations: string[] = [];
    
    if (progress.phonological_awareness < 70) {
      recommendations.push("Focus on rhyming games and sound identification exercises");
    }
    if (progress.articulation_score < 75) {
      recommendations.push("Practice minimal pairs and mouth position exercises");
    }
    if (progress.social_communication < 65) {
      recommendations.push("Work on turn-taking and social story activities");
    }
    
    return recommendations;
  }
}
