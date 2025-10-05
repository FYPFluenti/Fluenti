/**
 * Therapeutic Scoring System
 * Advanced scoring algorithms for speech therapy games
 */

export interface TherapeuticScore {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  clarityScore: number;
  timingScore: number;
  feedback: string[];
  recommendations: string[];
}

export interface ScoringCriteria {
  accuracy: number;
  attempts: number;
  timeSpent: number;
  hintsUsed: number;
  mistakesMade: number;
  targetDifficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Calculate comprehensive therapeutic score
 */
export const calculateTherapeuticScore = (
  criteria: ScoringCriteria
): TherapeuticScore => {
  const {
    accuracy,
    attempts,
    timeSpent,
    hintsUsed,
    mistakesMade,
    targetDifficulty
  } = criteria;

  // Base scores
  const pronunciationScore = accuracy;
  const fluencyScore = calculateFluencyScore(attempts, timeSpent);
  const clarityScore = calculateClarityScore(accuracy, mistakesMade);
  const timingScore = calculateTimingScore(timeSpent, targetDifficulty);

  // Overall score (weighted average)
  const overallScore = Math.round(
    (pronunciationScore * 0.4) +
    (fluencyScore * 0.3) +
    (clarityScore * 0.2) +
    (timingScore * 0.1)
  );

  // Generate feedback
  const feedback = generateFeedback({
    pronunciationScore,
    fluencyScore,
    clarityScore,
    timingScore,
    hintsUsed,
    mistakesMade
  });

  // Generate recommendations
  const recommendations = generateRecommendations({
    pronunciationScore,
    fluencyScore,
    clarityScore,
    timingScore
  });

  return {
    overallScore,
    pronunciationScore,
    fluencyScore,
    clarityScore,
    timingScore,
    feedback,
    recommendations
  };
};

/**
 * Calculate fluency score based on attempts and time
 */
const calculateFluencyScore = (attempts: number, timeSpent: number): number => {
  // Penalize multiple attempts and excessive time
  const attemptPenalty = Math.max(0, (attempts - 1) * 10);
  const timePenalty = timeSpent > 300 ? Math.floor((timeSpent - 300) / 60) * 5 : 0;
  
  const score = 100 - attemptPenalty - timePenalty;
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate clarity score
 */
const calculateClarityScore = (accuracy: number, mistakes: number): number => {
  const mistakePenalty = mistakes * 5;
  const score = accuracy - mistakePenalty;
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate timing score based on difficulty
 */
const calculateTimingScore = (
  timeSpent: number,
  difficulty: 'easy' | 'medium' | 'hard'
): number => {
  const idealTime = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 60 : 120;
  const timeDiff = Math.abs(timeSpent - idealTime);
  const score = 100 - (timeDiff / idealTime) * 100;
  return Math.max(0, Math.min(100, score));
};

/**
 * Generate personalized feedback
 */
const generateFeedback = (scores: {
  pronunciationScore: number;
  fluencyScore: number;
  clarityScore: number;
  timingScore: number;
  hintsUsed: number;
  mistakesMade: number;
}): string[] => {
  const feedback: string[] = [];

  // Pronunciation feedback
  if (scores.pronunciationScore >= 90) {
    feedback.push('🌟 Excellent pronunciation! You\'re doing great!');
  } else if (scores.pronunciationScore >= 70) {
    feedback.push('👍 Good pronunciation! Keep practicing!');
  } else {
    feedback.push('💪 Keep working on pronunciation. You\'ll get there!');
  }

  // Fluency feedback
  if (scores.fluencyScore >= 80) {
    feedback.push('✨ Great fluency and rhythm!');
  } else {
    feedback.push('🎯 Try to speak more smoothly without long pauses.');
  }

  // Clarity feedback
  if (scores.clarityScore >= 85) {
    feedback.push('🔊 Crystal clear speech! Well done!');
  } else {
    feedback.push('📢 Focus on speaking more clearly and distinctly.');
  }

  // Hints usage feedback
  if (scores.hintsUsed === 0) {
    feedback.push('🏆 Amazing! You did it without any hints!');
  } else if (scores.hintsUsed <= 2) {
    feedback.push('💡 Good job! You used hints wisely.');
  }

  return feedback;
};

/**
 * Generate therapeutic recommendations
 */
const generateRecommendations = (scores: {
  pronunciationScore: number;
  fluencyScore: number;
  clarityScore: number;
  timingScore: number;
}): string[] => {
  const recommendations: string[] = [];

  // Areas needing improvement
  const weakestArea = Object.entries(scores).reduce((a, b) => 
    a[1] < b[1] ? a : b
  );

  switch (weakestArea[0]) {
    case 'pronunciationScore':
      recommendations.push('Practice individual sounds more frequently');
      recommendations.push('Use the mirror to watch your mouth movements');
      break;
    case 'fluencyScore':
      recommendations.push('Practice speaking at a steady pace');
      recommendations.push('Try reading aloud to improve flow');
      break;
    case 'clarityScore':
      recommendations.push('Focus on articulating each word clearly');
      recommendations.push('Slow down and emphasize consonants');
      break;
    case 'timingScore':
      recommendations.push('Work on your speaking pace');
      recommendations.push('Practice with a timer to build consistency');
      break;
  }

  // General recommendations
  if (scores.pronunciationScore < 70) {
    recommendations.push('Try easier difficulty level for more practice');
  }

  return recommendations;
};

/**
 * Calculate difficulty adjustment recommendation
 */
export const recommendDifficulty = (
  averageScore: number,
  currentDifficulty: 'easy' | 'medium' | 'hard'
): 'easy' | 'medium' | 'hard' => {
  if (averageScore >= 85 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  } else if (averageScore < 60 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }
  return currentDifficulty;
};

/**
 * Generate progress report
 */
export const generateProgressReport = (
  sessions: TherapeuticScore[]
): {
  trend: 'improving' | 'stable' | 'declining';
  averageScore: number;
  strongAreas: string[];
  weakAreas: string[];
} => {
  if (sessions.length === 0) {
    return {
      trend: 'stable',
      averageScore: 0,
      strongAreas: [],
      weakAreas: []
    };
  }

  // Calculate average
  const averageScore = sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length;

  // Determine trend
  const recentSessions = sessions.slice(-3);
  const olderSessions = sessions.slice(0, -3);
  
  const recentAvg = recentSessions.reduce((sum, s) => sum + s.overallScore, 0) / recentSessions.length;
  const olderAvg = olderSessions.length > 0 
    ? olderSessions.reduce((sum, s) => sum + s.overallScore, 0) / olderSessions.length
    : recentAvg;

  let trend: 'improving' | 'stable' | 'declining';
  if (recentAvg > olderAvg + 5) {
    trend = 'improving';
  } else if (recentAvg < olderAvg - 5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Identify strong and weak areas
  const avgScores = {
    pronunciation: sessions.reduce((sum, s) => sum + s.pronunciationScore, 0) / sessions.length,
    fluency: sessions.reduce((sum, s) => sum + s.fluencyScore, 0) / sessions.length,
    clarity: sessions.reduce((sum, s) => sum + s.clarityScore, 0) / sessions.length,
    timing: sessions.reduce((sum, s) => sum + s.timingScore, 0) / sessions.length,
  };

  const strongAreas = Object.entries(avgScores)
    .filter(([, score]) => score >= 80)
    .map(([area]) => area);

  const weakAreas = Object.entries(avgScores)
    .filter(([, score]) => score < 70)
    .map(([area]) => area);

  return {
    trend,
    averageScore: Math.round(averageScore),
    strongAreas,
    weakAreas
  };
};
