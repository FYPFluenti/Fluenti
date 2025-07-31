import connectDB from "./mongodb";
import { User, SpeechSession, SpeechRecord, UserProgress, EmotionalSession } from "./models";
import { nanoid } from "nanoid";

// Connect to MongoDB
connectDB();

export const mongoStorage = {
  // User operations
  async upsertUser(userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    userType?: 'child' | 'adult' | 'guardian';
    language?: 'english' | 'urdu' | 'both';
  }) {
    try {
      const user = await User.findOneAndUpdate(
        { id: userData.id },
        { 
          ...userData, 
          updatedAt: new Date() 
        },
        { upsert: true, new: true }
      );
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const user = await User.findOne({ id: userId });
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async updateUser(userId: string, updates: any) {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Speech therapy operations
  async createSpeechSession(sessionData: {
    userId: string;
    sessionType: 'assessment' | 'exercise' | 'practice';
    exerciseData?: any;
  }) {
    try {
      const session = new SpeechSession({
        id: nanoid(),
        ...sessionData
      });
      await session.save();
      return session;
    } catch (error) {
      console.error('Error creating speech session:', error);
      throw error;
    }
  },

  async updateSpeechSession(sessionId: string, updates: any) {
    try {
      const session = await SpeechSession.findOneAndUpdate(
        { id: sessionId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      return session;
    } catch (error) {
      console.error('Error updating speech session:', error);
      throw error;
    }
  },

  async getSpeechSessions(userId: string, limit = 10) {
    try {
      const sessions = await SpeechSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return sessions;
    } catch (error) {
      console.error('Error getting speech sessions:', error);
      throw error;
    }
  },

  async createSpeechRecord(recordData: {
    sessionId: string;
    userId: string;
    wordAttempted: string;
    userPronunciation?: string;
    accuracyScore?: number;
    feedback?: string;
    audioUrl?: string;
  }) {
    try {
      const record = new SpeechRecord({
        id: nanoid(),
        ...recordData
      });
      await record.save();
      return record;
    } catch (error) {
      console.error('Error creating speech record:', error);
      throw error;
    }
  },

  // User progress operations
  async getUserProgress(userId: string) {
    try {
      let progress = await UserProgress.findOne({ userId });
      if (!progress) {
        progress = new UserProgress({
          id: nanoid(),
          userId,
          totalSessions: 0,
          totalWords: 0,
          averageAccuracy: 0,
          streakDays: 0,
          skillLevels: {},
          achievements: []
        });
        await progress.save();
      }
      return progress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  },

  async updateUserProgress(userId: string, updates: any) {
    try {
      const progress = await UserProgress.findOneAndUpdate(
        { userId },
        { ...updates, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return progress;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  },

  // Emotional support operations
  async createEmotionalSession(sessionData: {
    userId: string;
    sessionType: 'chat' | 'assessment' | 'crisis';
    emotionalState?: string;
  }) {
    try {
      const session = new EmotionalSession({
        id: nanoid(),
        ...sessionData,
        messages: []
      });
      await session.save();
      return session;
    } catch (error) {
      console.error('Error creating emotional session:', error);
      throw error;
    }
  },

  async addMessageToEmotionalSession(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
  }) {
    try {
      const session = await EmotionalSession.findOneAndUpdate(
        { id: sessionId },
        { 
          $push: { 
            messages: { 
              ...message, 
              timestamp: new Date() 
            } 
          } 
        },
        { new: true }
      );
      return session;
    } catch (error) {
      console.error('Error adding message to emotional session:', error);
      throw error;
    }
  },

  async getEmotionalSessions(userId: string, limit = 10) {
    try {
      const sessions = await EmotionalSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return sessions;
    } catch (error) {
      console.error('Error getting emotional sessions:', error);
      throw error;
    }
  }
};
