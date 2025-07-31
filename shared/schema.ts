import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").$type<"child" | "adult" | "guardian">().notNull().default("child"),
  language: varchar("language").$type<"english" | "urdu" | "both">().notNull().default("english"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Speech therapy sessions and progress
export const speechSessions = pgTable("speech_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: varchar("session_type").$type<"assessment" | "exercise" | "practice">().notNull(),
  exerciseData: jsonb("exercise_data"), // Stores exercise configuration and results
  accuracyScore: real("accuracy_score"), // Overall session accuracy percentage
  duration: integer("duration"), // Session duration in seconds
  wordsCompleted: integer("words_completed").default(0),
  achievements: text("achievements").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual word/phrase practice records
export const speechRecords = pgTable("speech_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => speechSessions.id),
  word: varchar("word").notNull(),
  phonetic: varchar("phonetic"), // IPA phonetic transcription
  userAudio: text("user_audio"), // Base64 audio data or file path
  accuracyScore: real("accuracy_score"), // 0-100 percentage
  feedback: text("feedback"), // AI-generated feedback
  attempts: integer("attempts").default(1),
  language: varchar("language").$type<"english" | "urdu">().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emotional support chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  emotionDetected: varchar("emotion_detected"), // Detected emotional state
  supportType: varchar("support_type"), // Type of support provided
  duration: integer("duration"), // Chat duration in seconds
  messagesCount: integer("messages_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id),
  sender: varchar("sender").$type<"user" | "ai">().notNull(),
  message: text("message").notNull(),
  emotion: varchar("emotion"), // Detected emotion for user messages
  confidence: real("confidence"), // Emotion detection confidence
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress and achievements
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  overallAccuracy: real("overall_accuracy").default(0),
  sessionsCompleted: integer("sessions_completed").default(0),
  totalPracticeTime: integer("total_practice_time").default(0), // in seconds
  currentStreak: integer("current_streak").default(0), // days
  longestStreak: integer("longest_streak").default(0),
  achievements: text("achievements").array().default([]),
  level: integer("level").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guardian-child relationships
export const guardianships = pgTable("guardianships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guardianId: varchar("guardian_id").notNull().references(() => users.id),
  childId: varchar("child_id").notNull().references(() => users.id),
  relationship: varchar("relationship").notNull(), // parent, guardian, therapist, etc.
  permissions: text("permissions").array().default(["view_progress", "schedule_sessions"]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for type inference
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertSpeechSession = typeof speechSessions.$inferInsert;
export type SpeechSession = typeof speechSessions.$inferSelect;

export type InsertSpeechRecord = typeof speechRecords.$inferInsert;
export type SpeechRecord = typeof speechRecords.$inferSelect;

export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertGuardianship = typeof guardianships.$inferInsert;
export type Guardianship = typeof guardianships.$inferSelect;

// Validation schemas
export const createSpeechSessionSchema = createInsertSchema(speechSessions).omit({
  id: true,
  createdAt: true,
});

export const createSpeechRecordSchema = createInsertSchema(speechRecords).omit({
  id: true,
  createdAt: true,
});

export const createChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const updateUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  userId: true,
  updatedAt: true,
});
