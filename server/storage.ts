import {
  users,
  speechSessions,
  speechRecords,
  chatSessions,
  chatMessages,
  userProgress,
  guardianships,
  type User,
  type UpsertUser,
  type SpeechSession,
  type SpeechRecord,
  type ChatSession,
  type ChatMessage,
  type UserProgress,
  type Guardianship,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Speech therapy operations
  createSpeechSession(userId: string, sessionType: 'assessment' | 'exercise' | 'practice'): Promise<SpeechSession>;
  getSpeechSession(sessionId: string): Promise<SpeechSession | undefined>;
  updateSpeechSession(sessionId: string, updates: Partial<SpeechSession>): Promise<SpeechSession>;
  
  createSpeechRecord(data: {
    sessionId: string;
    word: string;
    phonetic?: string;
    accuracyScore: number;
    feedback: string;
    language: 'english' | 'urdu';
    userAudio?: string;
  }): Promise<SpeechRecord>;
  
  getUserSessions(userId: string, limit?: number): Promise<SpeechSession[]>;
  getSessionRecords(sessionId: string): Promise<SpeechRecord[]>;
  
  // Chat operations
  createChatSession(userId: string): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  addChatMessage(data: {
    sessionId: string;
    sender: 'user' | 'ai';
    message: string;
    emotion?: string;
    confidence?: number;
  }): Promise<ChatMessage>;
  getChatMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  
  // Progress tracking
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress>;
  
  // Guardian operations
  createGuardianship(guardianId: string, childId: string, relationship: string): Promise<Guardianship>;
  getGuardianChildren(guardianId: string): Promise<User[]>;
  getChildGuardians(childId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Speech therapy operations
  async createSpeechSession(userId: string, sessionType: 'assessment' | 'exercise' | 'practice'): Promise<SpeechSession> {
    const [session] = await db.insert(speechSessions).values({
      userId,
      sessionType,
      exerciseData: {},
    }).returning();
    return session;
  }

  async getSpeechSession(sessionId: string): Promise<SpeechSession | undefined> {
    const [session] = await db.select().from(speechSessions).where(eq(speechSessions.id, sessionId));
    return session;
  }

  async updateSpeechSession(sessionId: string, updates: Partial<SpeechSession>): Promise<SpeechSession> {
    const [session] = await db
      .update(speechSessions)
      .set(updates)
      .where(eq(speechSessions.id, sessionId))
      .returning();
    return session;
  }

  async createSpeechRecord(data: {
    sessionId: string;
    word: string;
    phonetic?: string;
    accuracyScore: number;
    feedback: string;
    language: 'english' | 'urdu';
    userAudio?: string;
  }): Promise<SpeechRecord> {
    const [record] = await db.insert(speechRecords).values({
      sessionId: data.sessionId,
      word: data.word,
      phonetic: data.phonetic,
      accuracyScore: data.accuracyScore,
      feedback: data.feedback,
      language: data.language,
      userAudio: data.userAudio,
    }).returning();
    return record;
  }

  async getUserSessions(userId: string, limit = 10): Promise<SpeechSession[]> {
    return await db
      .select()
      .from(speechSessions)
      .where(eq(speechSessions.userId, userId))
      .orderBy(desc(speechSessions.createdAt))
      .limit(limit);
  }

  async getSessionRecords(sessionId: string): Promise<SpeechRecord[]> {
    return await db
      .select()
      .from(speechRecords)
      .where(eq(speechRecords.sessionId, sessionId))
      .orderBy(desc(speechRecords.createdAt));
  }

  // Chat operations
  async createChatSession(userId: string): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values({
      userId,
      messagesCount: 0,
    }).returning();
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
    return session;
  }

  async addChatMessage(data: {
    sessionId: string;
    sender: 'user' | 'ai';
    message: string;
    emotion?: string;
    confidence?: number;
  }): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values({
      sessionId: data.sessionId,
      sender: data.sender,
      message: data.message,
      emotion: data.emotion,
      confidence: data.confidence,
    }).returning();

    // Update session message count
    const messageCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, data.sessionId));
      
    await db
      .update(chatSessions)
      .set({
        messagesCount: messageCount[0]?.count || 0,
      })
      .where(eq(chatSessions.id, data.sessionId));

    return message;
  }

  async getChatMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Progress tracking
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress;
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    const existingProgress = await this.getUserProgress(userId);
    
    if (existingProgress) {
      const [progress] = await db
        .update(userProgress)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProgress.userId, userId))
        .returning();
      return progress;
    } else {
      const [progress] = await db.insert(userProgress).values({
        userId,
        ...updates,
      }).returning();
      return progress;
    }
  }

  // Guardian operations
  async createGuardianship(guardianId: string, childId: string, relationship: string): Promise<Guardianship> {
    const [guardianship] = await db.insert(guardianships).values({
      guardianId,
      childId,
      relationship,
    }).returning();
    return guardianship;
  }

  async getGuardianChildren(guardianId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(guardianships)
      .innerJoin(users, eq(guardianships.childId, users.id))
      .where(eq(guardianships.guardianId, guardianId));
    
    return result.map(r => r.user);
  }

  async getChildGuardians(childId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(guardianships)
      .innerJoin(users, eq(guardianships.guardianId, users.id))
      .where(eq(guardianships.childId, childId));
    
    return result.map(r => r.user);
  }
}

export const storage = new DatabaseStorage();
