import mongoose from 'mongoose';

const childProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  childName: {
    type: String,
    required: true
  },
  
  // Overall Statistics
  overallStats: {
    totalSessions: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    totalWordsCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    currentLevel: { type: Number, default: 1 },
    experiencePoints: { type: Number, default: 0 }
  },
  
  // Game Mode Progress
  gameModeStats: {
    story: {
      sessionsPlayed: { type: Number, default: 0 },
      storiesCompleted: { type: Number, default: 0 },
      animalsHelped: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      favoriteTheme: String,
      lastTheme: String
    },
    challenge: {
      sessionsPlayed: { type: Number, default: 0 },
      challengesCompleted: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      favoriteMode: String,
      modesUnlocked: [String]
    },
    dailyQuest: {
      questsCompleted: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastQuestDate: Date,
      completedToday: { type: Boolean, default: false }
    }
  },
  
  // Sound Progress Tracking
  soundProgress: [{
    sound: String, // e.g., 'r', 's', 'th'
    wordsPracticed: Number,
    averageAccuracy: Number,
    firstPracticed: Date,
    lastPracticed: Date,
    improvementRate: Number, // percentage
    masteryLevel: { 
      type: String, 
      enum: ['beginner', 'practicing', 'improving', 'confident', 'mastered'],
      default: 'beginner'
    }
  }],
  
  // Collection System
  collections: {
    companions: [{
      id: String,
      name: String,
      emoji: String,
      rarity: String,
      unlockedAt: Date,
      timesUsed: Number
    }],
    badges: [{
      id: String,
      name: String,
      icon: String,
      description: String,
      rarity: String,
      unlockedAt: Date
    }],
    themes: [{
      id: String,
      name: String,
      colors: [String],
      unlockedAt: Date
    }],
    miniGames: [{
      id: String,
      name: String,
      description: String,
      unlockedAt: Date,
      timesPlayed: Number,
      highScore: Number
    }]
  },
  
  // Achievements
  achievements: [{
    id: String,
    category: String, // 'milestone', 'skill', 'streak', 'special'
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date,
    progress: {
      current: Number,
      target: Number,
      isCompleted: Boolean
    }
  }],
  
  // Session History (last 30 sessions)
  recentSessions: [{
    sessionId: String,
    gameMode: String,
    date: Date,
    score: Number,
    accuracy: Number,
    wordsCompleted: Number,
    duration: Number
  }],
  
  // Daily Engagement
  dailyEngagement: {
    lastPlayedDate: Date,
    consecutiveDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalDaysPlayed: { type: Number, default: 0 },
    averageSessionsPerWeek: { type: Number, default: 0 }
  },
  
  // AI Personalization Data
  preferences: {
    favoriteCompanion: String,
    favoriteStoryTheme: String,
    favoriteChallengeMode: String,
    preferredDifficulty: { type: Number, default: 5 },
    lastSelectedMode: String
  },
  
  // Parent/Therapist Notes
  notes: [{
    date: Date,
    author: String, // 'parent' | 'therapist' | 'system'
    content: String,
    category: String // 'progress', 'concern', 'achievement'
  }]
}, {
  timestamps: true
});

// Indexes
childProgressSchema.index({ userId: 1 });
childProgressSchema.index({ 'dailyEngagement.lastPlayedDate': 1 });
childProgressSchema.index({ 'overallStats.totalScore': -1 });

// Methods to update progress
childProgressSchema.methods.updateAfterSession = async function(sessionData: any) {
  // Update overall stats
  this.overallStats.totalSessions += 1;
  this.overallStats.totalScore += sessionData.score || 0;
  this.overallStats.totalStars += sessionData.stars || 0;
  this.overallStats.totalWordsCompleted += sessionData.wordsCompleted || 0;
  this.overallStats.totalTimeSpent += sessionData.duration || 0;
  
  // Recalculate average accuracy
  const totalAccuracy = this.overallStats.averageAccuracy * (this.overallStats.totalSessions - 1) + (sessionData.accuracy || 0);
  this.overallStats.averageAccuracy = totalAccuracy / this.overallStats.totalSessions;
  
  // Update best streak
  if (sessionData.streak > this.overallStats.bestStreak) {
    this.overallStats.bestStreak = sessionData.streak;
  }
  
  // Update game mode specific stats
  const gameMode = sessionData.gameMode;
  if (gameMode && this.gameModeStats[gameMode]) {
    this.gameModeStats[gameMode].sessionsPlayed += 1;
  }
  
  // Update daily engagement
  const today = new Date().setHours(0, 0, 0, 0);
  const lastPlayed = this.dailyEngagement.lastPlayedDate ? 
    new Date(this.dailyEngagement.lastPlayedDate).setHours(0, 0, 0, 0) : null;
  
  if (!lastPlayed || lastPlayed < today) {
    // New day
    this.dailyEngagement.totalDaysPlayed += 1;
    
    if (lastPlayed && (today - lastPlayed === 86400000)) {
      // Consecutive day
      this.dailyEngagement.consecutiveDays += 1;
      if (this.dailyEngagement.consecutiveDays > this.dailyEngagement.longestStreak) {
        this.dailyEngagement.longestStreak = this.dailyEngagement.consecutiveDays;
      }
    } else if (lastPlayed && (today - lastPlayed > 86400000)) {
      // Streak broken
      this.dailyEngagement.consecutiveDays = 1;
    }
  }
  
  this.dailyEngagement.lastPlayedDate = new Date();
  
  // Add to recent sessions (keep last 30)
  this.recentSessions.unshift({
    sessionId: sessionData.sessionId,
    gameMode: sessionData.gameMode,
    date: new Date(),
    score: sessionData.score,
    accuracy: sessionData.accuracy,
    wordsCompleted: sessionData.wordsCompleted,
    duration: sessionData.duration
  });
  
  if (this.recentSessions.length > 30) {
    this.recentSessions = this.recentSessions.slice(0, 30);
  }
  
  await this.save();
};

export const ChildProgress = mongoose.model('ChildProgress', childProgressSchema);
