import mongoose from 'mongoose';

/**
 * Daily Quest Model
 * Stores daily challenges for users with theme, rewards, and completion tracking
 */

interface IDailyQuest extends mongoose.Document {
  userId: string;
  questDate: Date; // The date this quest was generated for (YYYY-MM-DD)
  theme: string; // "Ocean Adventure", "Space Explorer", "Jungle Safari", etc.
  emoji: string; // 🏆, 🌊, 🚀, 🌴, etc.
  description: string; // "Help marine animals find their way home!"
  difficulty: 'easy' | 'medium' | 'hard';
  challengeMode: string; // 'speed_round', 'memory_match', 'perfect_streak', etc.
  targetScore: number; // Minimum score to complete
  targetAccuracy: number; // Minimum accuracy to complete (e.g., 80)
  bonusReward: {
    type: 'character' | 'badge' | 'theme' | 'minigame';
    name: string;
    rarity: 'legendary' | 'epic' | 'rare';
    icon: string; // emoji
    description: string;
  };
  completedAt?: Date;
  sessionId?: string; // Session where quest was completed
  finalScore?: number;
  finalAccuracy?: number;
  isCompleted: boolean;
  streakBonus?: number; // Extra points for maintaining streak
  createdAt: Date;
  
  // Instance methods
  checkCompletion(score: number, accuracy: number): boolean;
  complete(sessionId: string, score: number, accuracy: number, streakBonus?: number): Promise<IDailyQuest>;
}

// Model interface with static methods
interface IDailyQuestModel extends mongoose.Model<IDailyQuest> {
  getTodayQuest(userId: string): Promise<IDailyQuest | null>;
  getStreak(userId: string): Promise<number>;
}

const dailyQuestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
    // ✅ REMOVED: index: true (duplicate with compound index below)
  },
  questDate: {
    type: Date,
    required: true
    // ✅ REMOVED: index: true (duplicate with compound index below)
  },
  theme: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  challengeMode: {
    type: String,
    required: true
  },
  targetScore: {
    type: Number,
    required: true
  },
  targetAccuracy: {
    type: Number,
    required: true,
    default: 70
  },
  bonusReward: {
    type: {
      type: String,
      enum: ['character', 'badge', 'theme', 'minigame'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rarity: {
      type: String,
      enum: ['legendary', 'epic', 'rare'],
      default: 'epic'
    },
    icon: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  completedAt: {
    type: Date
  },
  sessionId: {
    type: String
  },
  finalScore: {
    type: Number
  },
  finalAccuracy: {
    type: Number
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  streakBonus: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one quest per user per day
dailyQuestSchema.index({ userId: 1, questDate: 1 }, { unique: true });

// Method to check if quest is successful
dailyQuestSchema.methods.checkCompletion = function(score: number, accuracy: number) {
  return score >= this.targetScore && accuracy >= this.targetAccuracy;
};

// Method to complete quest
dailyQuestSchema.methods.complete = async function(sessionId: string, score: number, accuracy: number, streakBonus: number = 0) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.sessionId = sessionId;
  this.finalScore = score;
  this.finalAccuracy = accuracy;
  this.streakBonus = streakBonus;
  await this.save();
  return this;
};

// Static method to get today's quest for user
dailyQuestSchema.statics.getTodayQuest = async function(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await this.findOne({
    userId,
    questDate: today
  });
};

// Static method to get user's quest streak
dailyQuestSchema.statics.getStreak = async function(userId: string) {
  const quests = await this.find({ 
    userId, 
    isCompleted: true 
  }).sort({ questDate: -1 });

  if (quests.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const quest of quests) {
    const questDate = new Date(quest.questDate);
    questDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((currentDate.getTime() - questDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const DailyQuest = mongoose.model<IDailyQuest, IDailyQuestModel>('DailyQuest', dailyQuestSchema);

export default DailyQuest;
export type { IDailyQuest, IDailyQuestModel };
