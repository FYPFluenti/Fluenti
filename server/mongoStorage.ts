import connectDB, { isMongoConnected, waitForConnection } from "./mongodb";
import { User, SpeechSession, SpeechRecord, UserProgress, EmotionalSession } from "./models";
import { nanoid } from "nanoid";

// Connect to MongoDB and initialize the connection
let dbConnection = connectDB();

export const mongoStorage = {
  // Enhanced DB connection checker with timeout
  _ensureConnected: async (timeoutMs = 15000) => {
    try {
      // Check if already connected
      if (isMongoConnected()) {
        return true;
      }
      
      // Try to establish connection
      console.log('🔄 Ensuring MongoDB connection...');
      await dbConnection;
      
      // Wait for actual connection with timeout
      const connected = await waitForConnection(timeoutMs);
      
      if (!connected) {
        throw new Error(`MongoDB connection timeout after ${timeoutMs}ms`);
      }
      
      console.log('✅ MongoDB connection verified');
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      
      // In development, allow operations without MongoDB
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Continuing without MongoDB (development mode)');
        return false;
      }
      
      // Retry connection once
      try {
        console.log('🔄 Retrying MongoDB connection...');
        dbConnection = connectDB();
        await dbConnection;
        
        const retryConnected = await waitForConnection(5000);
        if (retryConnected) {
          console.log('✅ MongoDB reconnected successfully');
          return true;
        }
      } catch (retryError) {
        console.error("❌ MongoDB retry failed:", retryError);
      }
      
      throw error;
    }
  },

  // Helper to safely execute MongoDB operations with fallback
  async _safeExecute<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
    try {
      const connected = await this._ensureConnected(10000);
      
      if (!connected && process.env.NODE_ENV === 'development') {
        console.log('⚠️  MongoDB not available, using fallback');
        if (fallback !== undefined) return fallback;
        throw new Error('MongoDB not available and no fallback provided');
      }
      
      return await operation();
    } catch (error) {
      console.error('❌ MongoDB operation failed:', error);
      
      if (process.env.NODE_ENV === 'development' && fallback !== undefined) {
        console.log('⚠️  Using fallback value due to MongoDB error');
        return fallback;
      }
      
      throw error;
    }
  },

  // User operations with improved error handling
  async upsertUser(userData: {
    id: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    userType?: 'child' | 'adult' | 'guardian';
    language?: 'english' | 'urdu' | 'both';
  }) {
    return this._safeExecute(async () => {
      // First, try to find user by email to avoid duplicate key errors
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update existing user
        const user = await User.findOneAndUpdate(
          { email: userData.email },
          { 
            ...userData, 
            updatedAt: new Date() 
          },
          { new: true }
        );
        return user;
      } else {
        // Create new user - try by id first, then by email as fallback
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
        } catch (duplicateError: any) {
          // If still duplicate key error, try to find and update by email
          if (duplicateError.code === 11000) {
            console.log('Duplicate key error, trying to find by email...');
            const user = await User.findOneAndUpdate(
              { email: userData.email },
              { 
                ...userData, 
                updatedAt: new Date() 
              },
              { new: true }
            );
            return user;
          }
          throw duplicateError;
        }
      }
    });
  },

  async getUser(userId: string) {
    return this._safeExecute(async () => {
      const user = await User.findOne({ id: userId });
      return user;
    }, null); // Return null if MongoDB is not available
  },

  async getUserByEmail(email: string) {
    return this._safeExecute(async () => {
      const user = await User.findOne({ email });
      return user;
    }, null);
  },

  async updateUser(userId: string, updates: any) {
    return this._safeExecute(async () => {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { 
          ...updates, 
          updatedAt: new Date() 
        },
        { new: true }
      );
      return user;
    });
  },

  // Speech session operations
  async createSpeechSession(sessionData: {
    userId: string;
    sessionType: 'assessment' | 'exercise' | 'practice';
    exerciseData?: any;
  }) {
    return this._safeExecute(async () => {
      const sessionId = nanoid();
      const session = new SpeechSession({
        sessionId,
        ...sessionData,
        createdAt: new Date()
      });
      await session.save();
      return session;
    });
  },

  async updateSpeechSession(sessionId: string, updates: any) {
    return this._safeExecute(async () => {
      const session = await SpeechSession.findOneAndUpdate(
        { sessionId },
        { 
          ...updates, 
          updatedAt: new Date() 
        },
        { new: true }
      );
      return session;
    });
  },

  async getSpeechSession(sessionId: string) {
    return this._safeExecute(async () => {
      const session = await SpeechSession.findOne({ sessionId });
      return session;
    }, null);
  },

  async getUserSpeechSessions(userId: string, limit = 10) {
    return this._safeExecute(async () => {
      const sessions = await SpeechSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return sessions;
    }, []);
  },

  // Speech record operations
  async createSpeechRecord(recordData: {
    sessionId: string;
    userId: string;
    transcription: string;
    audioPath?: string;
    accuracy?: number;
    feedback?: string;
    exerciseType?: string;
  }) {
    return this._safeExecute(async () => {
      const recordId = nanoid();
      const record = new SpeechRecord({
        recordId,
        ...recordData,
        createdAt: new Date()
      });
      await record.save();
      return record;
    });
  },

  async getSpeechRecord(recordId: string) {
    return this._safeExecute(async () => {
      const record = await SpeechRecord.findOne({ recordId });
      return record;
    }, null);
  },

  async getUserSpeechRecords(userId: string, limit = 20) {
    return this._safeExecute(async () => {
      const records = await SpeechRecord.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return records;
    }, []);
  },

  // User progress operations
  async updateUserProgress(userId: string, progressData: {
    exerciseType: string;
    score?: number;
    accuracy?: number;
    completionTime?: number;
    difficulties?: string[];
  }) {
    return this._safeExecute(async () => {
      const progress = await UserProgress.findOneAndUpdate(
        { userId, exerciseType: progressData.exerciseType },
        {
          $inc: { totalAttempts: 1 },
          $push: {
            scores: progressData.score || 0,
            accuracies: progressData.accuracy || 0,
            completionTimes: progressData.completionTime || 0
          },
          $set: {
            lastAttempt: new Date(),
            ...(progressData.difficulties && { lastDifficulties: progressData.difficulties })
          }
        },
        { upsert: true, new: true }
      );
      return progress;
    });
  },

  async getUserProgress(userId: string) {
    return this._safeExecute(async () => {
      const progress = await UserProgress.find({ userId });
      return progress;
    }, []);
  },

  // Emotional session operations
  async createEmotionalSession(sessionData: {
    userId: string;
    sessionType?: 'chat' | 'assessment' | 'crisis';
    emotion?: string;
    response?: string;
    confidence?: number;
  }) {
    return this._safeExecute(async () => {
      const sessionId = nanoid();
      const session = new EmotionalSession({
        id: sessionId,
        userId: sessionData.userId,
        sessionType: sessionData.sessionType || 'chat',
        messages: [],
        emotionalState: sessionData.emotion,
        riskLevel: 'low',
        createdAt: new Date()
      });
      await session.save();
      return session;
    });
  },

  async getUserEmotionalSessions(userId: string, limit = 10) {
    return this._safeExecute(async () => {
      const sessions = await EmotionalSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return sessions;
    }, []);
  },

  async addMessageToEmotionalSession(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
  }) {
    return this._safeExecute(async () => {
      const session = await EmotionalSession.findOne({ id: sessionId });
      if (!session) {
        throw new Error('Session not found');
      }
      
      session.messages.push({
        role: message.role,
        content: message.content,
        timestamp: new Date()
      });
      
      await session.save();
      return session;
    });
  },

  async getEmotionalSession(sessionId: string) {
    return this._safeExecute(async () => {
      const session = await EmotionalSession.findOne({ id: sessionId });
      return session;
    });
  },

  // Alias for compatibility with routes.ts
  async getEmotionalSessions(userId: string, limit = 10) {
    return this.getUserEmotionalSessions(userId, limit);
  },

  // Therapeutic game session operations
  async saveTherapeuticSession(sessionData: any) {
    return this._safeExecute(async () => {
      // For now, store in SpeechSession with a therapeutic flag
      // Later we can create a dedicated TherapeuticSession model
      const session = new SpeechSession({
        userId: sessionData.userId,
        sessionId: nanoid(),
        gameId: sessionData.gameId,
        startTime: sessionData.startTime || new Date(),
        endTime: sessionData.endTime || new Date(),
        level: sessionData.currentLevel || 1,
        score: sessionData.score || 0,
        wordsCompleted: sessionData.wordsCompleted || [],
        accuracy: sessionData.accuracy || 0,
        responses: sessionData.responses || [],
        completed: sessionData.completed || true,
        // Add therapeutic-specific fields
        therapeutic_data: sessionData.therapeutic_data,
        evidenceLevel: sessionData.evidenceLevel || 'clinical-grade',
        timestamp: sessionData.timestamp || new Date()
      });
      
      await session.save();
      
      console.log('Therapeutic session saved:', {
        userId: sessionData.userId,
        gameId: sessionData.gameId,
        sessionId: session.sessionId
      });
      
      return { id: session.sessionId, ...sessionData };
    }, { id: `mock-${Date.now()}`, ...sessionData });
  },

  async updateUserTherapeuticProgress(userId: string, therapeuticData: any) {
    return this._safeExecute(async () => {
      const updateFields: any = {};
      
      if (therapeuticData.phonemeAwareness !== undefined) {
        updateFields.phonological_awareness = therapeuticData.phonemeAwareness;
      }
      
      if (therapeuticData.socialAccuracy !== undefined) {
        updateFields.social_communication = therapeuticData.socialAccuracy;
      }
      
      if (therapeuticData.articulationScore !== undefined) {
        updateFields.articulation_score = therapeuticData.articulationScore;
      }
      
      if (therapeuticData.languageScore !== undefined) {
        updateFields.language_comprehension = therapeuticData.languageScore;
      }
      
      if (therapeuticData.fluencyScore !== undefined) {
        updateFields.fluency_score = therapeuticData.fluencyScore;
      }
      
      // Update or create user progress
      const progress = await UserProgress.findOneAndUpdate(
        { userId },
        { 
          $set: updateFields,
          $inc: { sessions_completed: 1 },
          $currentDate: { lastSession: true }
        },
        { upsert: true, new: true }
      );
      
      console.log('User therapeutic progress updated:', {
        userId,
        updatedFields: Object.keys(updateFields)
      });
      
      return progress;
    }, null);
  },

  async getUserTherapeuticProgress(userId: string) {
    return this._safeExecute(async () => {
      const progress = await UserProgress.findOne({ userId });
      
      if (!progress) {
        // Return default progress
        return {
          userId,
          articulation_score: 70,
          phonological_awareness: 65,
          language_comprehension: 75,
          social_communication: 70,
          fluency_score: 70,
          sessions_completed: 0,
          level: 1,
          lastSession: new Date(),
          totalPracticeTime: 0
        };
      }
      
      return progress;
    }, {
      userId,
      articulation_score: 70,
      phonological_awareness: 65,
      language_comprehension: 75,
      social_communication: 70,
      fluency_score: 70,
      sessions_completed: 0,
      level: 1,
      lastSession: new Date(),
      totalPracticeTime: 0
    });
  },

  async getUserTherapeuticSessions(userId: string, limit = 10, offset = 0) {
    return this._safeExecute(async () => {
      // Query SpeechSession for therapeutic sessions
      const sessions = await SpeechSession.find({ 
        userId,
        therapeutic_data: { $exists: true }
      })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);
      
      const total = await SpeechSession.countDocuments({ 
        userId,
        therapeutic_data: { $exists: true }
      });
      
      return {
        sessions,
        total,
        limit,
        offset
      };
    }, {
      sessions: [],
      total: 0,
      limit,
      offset
    });
  },

  // Helper methods for testing and development
  async clearAllData() {
    return this._safeExecute(async () => {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('clearAllData can only be used in development');
      }
      
      await User.deleteMany({});
      await SpeechSession.deleteMany({});
      await SpeechRecord.deleteMany({});
      await UserProgress.deleteMany({});
      await EmotionalSession.deleteMany({});
      
      console.log('All development data cleared');
    });
  },

  async getConnectionStatus() {
    try {
      const connected = await this._ensureConnected(5000);
      return {
        connected: connected && isMongoConnected(),
        readyState: (require('mongoose') as any).connection?.readyState || 0,
        host: (require('mongoose') as any).connection?.host || 'unknown',
        name: (require('mongoose') as any).connection?.name || 'unknown'
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        readyState: 0
      };
    }
  }
};
