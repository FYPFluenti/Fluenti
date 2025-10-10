/**
 * Progress Tracking Utilities
 * Functions for tracking user progress and performance
 */

export interface GameProgress {
  gameId: number;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  accuracy: number;
  wordsCompleted: string[];
  mistakesMade: number;
  hintsUsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserStats {
  totalSessions: number;
  totalScore: number;
  averageAccuracy: number;
  totalTimeSpent: number; // in minutes
  gamesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  stars: number;
}

/**
 * Calculate XP earned from a session
 */
export const calculateXP = (
  score: number,
  accuracy: number,
  difficulty: 'easy' | 'medium' | 'hard'
): number => {
  const baseXP = score;
  const accuracyBonus = accuracy > 80 ? 20 : accuracy > 60 ? 10 : 0;
  const difficultyMultiplier = 
    difficulty === 'hard' ? 1.5 : 
    difficulty === 'medium' ? 1.2 : 1.0;
  
  return Math.round((baseXP + accuracyBonus) * difficultyMultiplier);
};

/**
 * Calculate stars earned (1-3 stars based on performance)
 */
export const calculateStars = (accuracy: number): number => {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
};

/**
 * Determine user level based on XP
 */
export const calculateLevel = (xp: number): number => {
  // Level progression: 100 XP per level, exponential growth
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

/**
 * Calculate XP needed for next level
 */
export const xpForNextLevel = (currentLevel: number): number => {
  return (currentLevel * currentLevel) * 100;
};

/**
 * Track daily streak
 */
export const updateStreak = (
  lastSessionDate: Date,
  currentDate: Date = new Date()
): { currentStreak: number; isStreakMaintained: boolean } => {
  const daysDiff = Math.floor(
    (currentDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysDiff === 0) {
    return { currentStreak: 1, isStreakMaintained: true };
  } else if (daysDiff === 1) {
    return { currentStreak: 1, isStreakMaintained: true };
  } else {
    return { currentStreak: 0, isStreakMaintained: false };
  }
};

/**
 * Save progress to localStorage
 */
export const saveProgress = (progress: GameProgress): void => {
  const key = `progress_${progress.sessionId}`;
  localStorage.setItem(key, JSON.stringify(progress));
  
  // Also update user stats
  updateUserStats(progress);
};

/**
 * Load user stats from localStorage
 */
export const loadUserStats = (userId: string): UserStats | null => {
  const key = `user_stats_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Update user stats after a session
 */
export const updateUserStats = (progress: GameProgress): void => {
  const userId = progress.userId;
  const stats = loadUserStats(userId) || {
    totalSessions: 0,
    totalScore: 0,
    averageAccuracy: 0,
    totalTimeSpent: 0,
    gamesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    xp: 0,
    stars: 0,
  };
  
  // Update stats
  stats.totalSessions += 1;
  stats.totalScore += progress.score;
  stats.averageAccuracy = 
    (stats.averageAccuracy * (stats.totalSessions - 1) + progress.accuracy) / 
    stats.totalSessions;
  stats.gamesCompleted += 1;
  
  // Calculate session duration
  if (progress.endTime) {
    const duration = (progress.endTime.getTime() - progress.startTime.getTime()) / (1000 * 60);
    stats.totalTimeSpent += duration;
  }
  
  // Update XP and level
  const earnedXP = calculateXP(progress.score, progress.accuracy, progress.difficulty);
  stats.xp += earnedXP;
  stats.level = calculateLevel(stats.xp);
  
  // Update stars
  const earnedStars = calculateStars(progress.accuracy);
  stats.stars += earnedStars;
  
  // Save updated stats
  const key = `user_stats_${userId}`;
  localStorage.setItem(key, JSON.stringify(stats));
};

/**
 * Get progress history for a user
 */
export const getProgressHistory = (userId: string): GameProgress[] => {
  const history: GameProgress[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('progress_')) {
      const data = localStorage.getItem(key);
      if (data) {
        const progress: GameProgress = JSON.parse(data);
        if (progress.userId === userId) {
          history.push(progress);
        }
      }
    }
  }
  
  return history.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
};
