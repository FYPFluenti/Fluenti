import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  childName: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  rewardType: {
    type: String,
    enum: ['character', 'badge', 'theme', 'minigame', 'power', 'achievement'],
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  icon: {
    type: String,
    default: '🎁'
  },
  description: {
    type: String,
    required: true
  },
  achievement: {
    type: String
  },
  abilities: [String],
  collectionProgress: {
    category: String,
    current: Number,
    total: Number,
    nextReward: String,
    nextMilestone: Number
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  gameMode: {
    type: String,
    enum: ['story', 'challenge', 'daily_quest'],
    required: true
  },
  metadata: {
    score: Number,
    streak: Number,
    accuracy: Number,
    wordsCompleted: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
rewardSchema.index({ userId: 1, unlockedAt: -1 });
rewardSchema.index({ userId: 1, gameMode: 1 });
rewardSchema.index({ sessionId: 1 });

export const Reward = mongoose.model('Reward', rewardSchema);
