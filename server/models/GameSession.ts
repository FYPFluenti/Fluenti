import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  gameId: {
    type: Number,
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number, // percentage
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  // Game-specific data
  gameData: {
    wordsAttempted: [{
      word: String,
      attempts: Number,
      accuracy: Number,
      phonemes: [String],
      timestamp: Date
    }],
    sentencesCompleted: [{
      sentence: String,
      accuracy: Number,
      grammarScore: Number,
      timestamp: Date
    }],
    soundsIdentified: [{
      sound: String,
      correct: Boolean,
      responseTime: Number,
      timestamp: Date
    }],
    rhythmPatterns: [{
      pattern: String,
      accuracy: Number,
      timing: Number,
      timestamp: Date
    }],
    storiesRead: [{
      storyId: String,
      comprehensionScore: Number,
      pronunciationScore: Number,
      timestamp: Date
    }],
    quickSounds: [{
      sound: String,
      responseTime: Number,
      accuracy: Number,
      timestamp: Date
    }]
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  starsEarned: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameSessionSchema.index({ userId: 1, gameId: 1, createdAt: -1 });
gameSessionSchema.index({ userId: 1, createdAt: -1 });

export const GameSession = mongoose.model('GameSession', gameSessionSchema);
