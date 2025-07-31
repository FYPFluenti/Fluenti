import { db } from "../db";
import { speechSessions, speechRecords, userProgress, users } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateSpeechFeedback, generatePersonalizedExercises } from "./openai";

export interface SpeechAssessmentResult {
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  recommendedLevel: number;
  exercises: any[];
}

export class SpeechService {
  static async createSession(userId: string, sessionType: 'assessment' | 'exercise' | 'practice') {
    const [session] = await db.insert(speechSessions).values({
      userId,
      sessionType,
      exerciseData: {},
    }).returning();
    
    return session;
  }

  static async recordSpeechAttempt(
    sessionId: string,
    word: string,
    phonetic: string,
    userTranscription: string,
    language: 'english' | 'urdu',
    userAudio?: string
  ) {
    // Generate AI feedback
    const feedback = await generateSpeechFeedback(word, phonetic, userTranscription, language);
    
    // Record the attempt
    const [record] = await db.insert(speechRecords).values({
      sessionId,
      word,
      phonetic,
      accuracyScore: feedback.accuracy,
      feedback: feedback.feedback,
      language,
      userAudio,
    }).returning();

    // Update session progress
    await this.updateSessionProgress(sessionId, feedback.accuracy);
    
    return {
      record,
      feedback
    };
  }

  static async updateSessionProgress(sessionId: string, newScore: number) {
    const session = await db.query.speechSessions.findFirst({
      where: eq(speechSessions.id, sessionId),
    });

    if (!session) return;

    // Calculate running average of accuracy
    const records = await db.query.speechRecords.findMany({
      where: eq(speechRecords.sessionId, sessionId),
    });

    const avgAccuracy = records.length > 0 
      ? records.reduce((sum, r) => sum + (r.accuracyScore || 0), 0) / records.length
      : newScore;

    await db.update(speechSessions)
      .set({
        accuracyScore: avgAccuracy,
        wordsCompleted: records.length,
      })
      .where(eq(speechSessions.id, sessionId));

    // Update user's overall progress
    await this.updateUserProgress(session.userId, avgAccuracy, records.length);
  }

  static async updateUserProgress(userId: string, sessionAccuracy: number, wordsCompleted: number) {
    const existingProgress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (existingProgress) {
      const newOverallAccuracy = ((existingProgress.overallAccuracy || 0) + sessionAccuracy) / 2;
      const newSessionsCompleted = (existingProgress.sessionsCompleted || 0) + 1;
      
      await db.update(userProgress)
        .set({
          overallAccuracy: newOverallAccuracy,
          sessionsCompleted: newSessionsCompleted,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.userId, userId));
    } else {
      await db.insert(userProgress).values({
        userId,
        overallAccuracy: sessionAccuracy,
        sessionsCompleted: 1,
        totalPracticeTime: 0,
      });
    }
  }

  static async conductInitialAssessment(
    userId: string,
    assessmentResults: { word: string; accuracy: number; language: 'english' | 'urdu' }[]
  ): Promise<SpeechAssessmentResult> {
    const sessionId = (await this.createSession(userId, 'assessment')).id;

    // Process each assessment result
    const processedResults = [];
    for (const result of assessmentResults) {
      const feedback = await generateSpeechFeedback(
        result.word,
        '',
        result.word,
        result.language
      );
      
      await db.insert(speechRecords).values({
        sessionId,
        word: result.word,
        accuracyScore: result.accuracy,
        feedback: feedback.feedback,
        language: result.language,
      });

      processedResults.push({
        ...result,
        feedback: feedback.feedback
      });
    }

    // Calculate assessment metrics
    const overallScore = assessmentResults.reduce((sum, r) => sum + r.accuracy, 0) / assessmentResults.length;
    const lowScoreWords = assessmentResults.filter(r => r.accuracy < 70);
    const highScoreWords = assessmentResults.filter(r => r.accuracy >= 85);

    const recommendedLevel = overallScore >= 90 ? 3 : overallScore >= 70 ? 2 : 1;

    // Get user info for personalized exercises
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const exercises = await generatePersonalizedExercises(
      recommendedLevel,
      user?.language || 'english',
      overallScore,
      lowScoreWords.map(w => w.word)
    );

    // Update session with final results
    await db.update(speechSessions)
      .set({
        accuracyScore: overallScore,
        wordsCompleted: assessmentResults.length,
        exerciseData: { 
          assessmentResults: processedResults,
          recommendedLevel,
          exercises 
        },
      })
      .where(eq(speechSessions.id, sessionId));

    return {
      overallScore,
      strengths: highScoreWords.map(w => w.word),
      improvementAreas: lowScoreWords.map(w => w.word),
      recommendedLevel,
      exercises,
    };
  }

  static async getUserProgress(userId: string) {
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    const recentSessions = await db.query.speechSessions.findMany({
      where: eq(speechSessions.userId, userId),
      orderBy: [desc(speechSessions.createdAt)],
      limit: 10,
    });

    return {
      progress,
      recentSessions,
    };
  }
}
