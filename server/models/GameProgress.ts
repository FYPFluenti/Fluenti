import mongoose from 'mongoose';

const gameProgressSchema = new mongoose.Schema({
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
  level: {
    type: Number,
    default: 1
  },
  stars: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  bestScore: {
    type: Number,
    default: 0
  },
  totalPlays: {
    type: Number,
    default: 0
  },
  averageAccuracy: {
    type: Number,
    default: 0
  },
  lastPlayedAt: {
    type: Date,
    default: Date.now
  },
  unlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
gameProgressSchema.index({ userId: 1, gameId: 1 }, { unique: true });

export const GameProgress = mongoose.model('GameProgress', gameProgressSchema);
