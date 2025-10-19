import mongoose from 'mongoose';

const sessionSummarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  childName: {
    type: String,
    required: true
  },
  gameMode: {
    type: String,
    enum: ['story', 'challenge', 'daily_quest'],
    required: true
  },
  
  // Summary Content
  title: {
    type: String,
    required: true
  },
  celebrationMessage: {
    type: String,
    required: true
  },
  
  // Performance Stats
  stats: {
    totalScore: { type: Number, required: true },
    starsEarned: { type: Number, required: true },
    bestStreak: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    timeSpent: { type: Number, required: true }, // in seconds
    wordsAttempted: { type: Number, required: true },
    wordsCompleted: { type: Number, required: true },
    perfectFirstTries: { type: Number, default: 0 }
  },
  
  // Achievements
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: Date
  }],
  
  // Unlocked Rewards
  rewards: [{
    type: String,
    name: String,
    rarity: String,
    icon: String,
    description: String
  }],
  
  // Progress Insights
  insights: {
    soundImprovement: {
      targetSound: String,
      previousAccuracy: Number,
      currentAccuracy: Number,
      improvement: Number
    },
    strengths: [String],
    areasToImprove: [String],
    readyForNext: [String]
  },
  
  // Companion Message
  companionMessage: {
    character: String,
    emoji: String,
    message: String
  },
  
  // Next Steps
  recommendations: {
    nextStoryTheme: String,
    suggestedDifficulty: Number,
    newSoundsToTry: [String],
    encouragement: String
  },
  
  // Session Duration
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  
  // Word History
  wordHistory: [{
    word: String,
    targetSound: String,
    attempts: Number,
    finalAccuracy: Number,
    isCorrect: Boolean,
    timeSpent: Number
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
sessionSummarySchema.index({ userId: 1, completedAt: -1 });
sessionSummarySchema.index({ userId: 1, gameMode: 1 });
sessionSummarySchema.index({ createdAt: -1 });

export const SessionSummary = mongoose.model('SessionSummary', sessionSummarySchema);
