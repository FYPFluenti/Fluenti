import { mongoStorage } from "../mongoStorage";
import { generateSpeechFeedback, generatePersonalizedExercises } from "./openai";
import { HfInference } from '@huggingface/inference';
import wav from 'wav';  // For potential audio conversion
import fs from 'fs';  // If needed for temp files

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function transcribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  try {
    // For Phase 1 testing - return mock transcription if no HF key
    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your-hf-token') {
      console.log('Mock STT: No Hugging Face API key configured, returning mock transcription');
      return `[Mock STT ${language.toUpperCase()}] This is a mock transcription for testing Phase 1 integration.`;
    }

    const model = 'openai/whisper-medium';  // Multilingual; supports Urdu/English
    // Convert buffer to Blob (Whisper expects audio file-like input)
    // Convert Buffer to Uint8Array to ensure compatibility with Blob constructor
    const uint8Array = new Uint8Array(audioBuffer);
    const audioBlob = new Blob([uint8Array], { type: 'audio/wav' });  // Assume WAV; adjust if frontend uses webm

    const result = await hf.automaticSpeechRecognition({
      model,
      data: audioBlob,
    });
    return result.text || '';
  } catch (error) {
    console.error('STT Error:', error);
    // Fallback to mock for testing
    return `[STT Error - Mock Response] Could not transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Placeholder for later phases (e.g., emotion detection)
export async function detectEmotion(text: string): Promise<{ emotion: string; score: number }> {
  // Implement in Phase 3
  return { emotion: 'neutral', score: 0.5 };
}

export interface SpeechAssessmentResult {
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  recommendedLevel: number;
  exercises: any[];
}

export class SpeechService {
  static async createSession(userId: string, sessionType: 'assessment' | 'exercise' | 'practice') {
    const session = await mongoStorage.createSpeechSession({
      userId,
      sessionType,
      exerciseData: {},
    });
    
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
    try {
      // Generate AI feedback
      const feedback = await generateSpeechFeedback(word, phonetic, userTranscription, language);
      
      // Get session to get userId
      const session = await mongoStorage.getSpeechSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Record the attempt
      const record = await mongoStorage.createSpeechRecord({
        sessionId,
        userId: session.userId,
        wordAttempted: word,
        userPronunciation: userTranscription,
        accuracyScore: feedback.accuracy,
        feedback: feedback.feedback,
        audioUrl: userAudio,
      });

      // Update session progress
      await this.updateSessionProgress(sessionId, feedback.accuracy);
      
      return {
        id: record.id,
        accuracyScore: feedback.accuracy,
        feedback: feedback.feedback,
        phoneticAnalysis: feedback.phoneticAnalysis || '',
        improvements: feedback.improvements || []
      };
    } catch (error) {
      console.error('Error in recordSpeechAttempt:', error);
      throw error;
    }
  }

  static async updateSessionProgress(sessionId: string, latestScore: number) {
    // For now, just update the session with the latest accuracy
    await mongoStorage.updateSpeechSession(sessionId, {
      accuracyScore: latestScore,
      wordsCompleted: 1, // Increment this properly later
    });
  }

  static async updateUserProgress(userId: string, sessionScore: number) {
    try {
      const progress = await mongoStorage.getUserProgress(userId);
      
      const totalSessions = (progress.totalSessions || 0) + 1;
      const totalWords = (progress.totalWords || 0) + 1;
      const currentAvg = progress.averageAccuracy || 0;
      const newAverage = ((currentAvg * (totalSessions - 1)) + sessionScore) / totalSessions;
      
      await mongoStorage.updateUserProgress(userId, {
        totalSessions,
        totalWords,
        averageAccuracy: newAverage,
        lastSessionDate: new Date(),
      });
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  static async getUserProgress(userId: string) {
    try {
      const progress = await mongoStorage.getUserProgress(userId);
      const sessions = await mongoStorage.getSpeechSessions(userId, 10);
      
      return {
        totalSessions: progress.totalSessions || 0,
        totalWords: progress.totalWords || 0,
        averageAccuracy: progress.averageAccuracy || 0,
        streakDays: progress.streakDays || 0,
        recentSessions: sessions,
        skillLevels: progress.skillLevels || {},
        achievements: progress.achievements || [],
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  static async getSessionDetails(sessionId: string) {
    try {
      // For now, return basic session info
      // TODO: Implement proper session details retrieval
      return {
        id: sessionId,
        status: 'active',
        progress: 0,
      };
    } catch (error) {
      console.error('Error getting session details:', error);
      throw error;
    }
  }

  static async conductAssessment(userId: string, responses: any[]): Promise<SpeechAssessmentResult> {
    // Simple assessment logic for now
    const totalScore = responses.reduce((sum: number, response: any) => sum + (response.accuracy || 0), 0);
    const averageScore = responses.length > 0 ? totalScore / responses.length : 0;

    // Determine user level based on average score
    const userLevel = Math.floor(averageScore / 20) + 1;

    const result: SpeechAssessmentResult = {
      overallScore: averageScore,
      strengths: averageScore > 80 ? ['Good pronunciation', 'Clear articulation'] : ['Effort and practice'],
      improvementAreas: averageScore < 70 ? ['Pronunciation accuracy', 'Speech clarity'] : [],
      recommendedLevel: userLevel,
      exercises: await generatePersonalizedExercises(userLevel, 'english', averageScore),
    };

    // Save assessment session
    await this.createSession(userId, 'assessment');
    await this.updateUserProgress(userId, averageScore);

    return result;
  }
}
