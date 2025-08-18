import { mongoStorage } from "../mongoStorage";
import { generateSpeechFeedback, generatePersonalizedExercises } from "./openai";
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Main transcription function using local Whisper
export async function transcribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Save buffer to temp WAV file
      const tempPath = path.join(__dirname, 'temp_audio.wav');
      fs.writeFileSync(tempPath, audioBuffer);

      // Python code for Whisper (auto-loads model on first run)
      // Use different model based on language
      const model = language === 'ur' ? 'openai/whisper-medium' : 'openai/whisper-small';
      const pythonCode = `
import torch
from transformers import pipeline
device = "cuda:0" if torch.cuda.is_available() else "cpu"
pipe = pipeline("automatic-speech-recognition", model="${model}", device=0 if torch.cuda.is_available() else -1)
transcription = pipe("${tempPath.replace(/\\/g, '\\\\')}")['text']  # Escape backslashes for Windows path
print(transcription)
      `;

      // Spawn Python process
      const python = spawn('python', ['-c', pythonCode]);

      let output = '';
      let errorOutput = '';
      python.stdout.on('data', (data) => { output += data.toString(); });
      python.stderr.on('data', (data) => { errorOutput += data.toString(); });
      python.on('close', (code) => {
        fs.unlinkSync(tempPath);  // Clean up temp file
        if (code !== 0) {
          reject(`Python error: ${errorOutput}`);
        } else {
          resolve(output.trim());
        }
      });
    } catch (err) {
      reject(`STT setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
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
