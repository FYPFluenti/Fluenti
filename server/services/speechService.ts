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

// Emotion detection using Hugging Face
export async function detectEmotion(text: string): Promise<{ emotion: string; score: number }> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your-hf-token' || !text.trim()) {
      console.log('Mock emotion detection: No API key or empty text');
      return performKeywordBasedDetection(text);
    }

    // Check if text contains Urdu characters - if so, prioritize keyword detection
    const hasUrdu = /[\u0600-\u06FF\u0750-\u077F]/.test(text);
    if (hasUrdu) {
      console.log('Urdu text detected, using keyword-based detection');
      const keywordResult = performKeywordBasedDetection(text);
      // If keyword detection finds something meaningful, use it
      if (keywordResult.score > 0.5) {
        return keywordResult;
      }
    }

    // Try simpler emotion classification model for English text
    try {
      const result = await hf.textClassification({
        model: 'j-hartmann/emotion-english-distilroberta-base', // More reliable English model
        inputs: text,
      });

      if (result && result.length > 0) {
        const topEmotion = result[0];
        const emotion = topEmotion.label.toLowerCase();
        const score = Math.round(topEmotion.score * 100) / 100;

        console.log(`HF Emotion detected: ${emotion} (${score})`);
        
        // For Urdu text or low confidence English results, prefer keyword fallback
        if (hasUrdu || score < 0.6) {
          console.log('Low confidence or Urdu text, trying keyword fallback');
          const keywordResult = performKeywordBasedDetection(text);
          if (keywordResult.score >= score) {
            return keywordResult;
          }
        }
        
        return { emotion, score };
      }
    } catch (hfError) {
      console.log('Hugging Face model failed, trying fallback:', hfError);
      // Fall through to keyword-based detection
    }

    // Fallback to keyword-based detection
    return performKeywordBasedDetection(text);
  } catch (error) {
    console.error('Emotion detection error:', error);
    return performKeywordBasedDetection(text);
  }
}

// Keyword-based emotion detection fallback
function performKeywordBasedDetection(text: string): { emotion: string; score: number } {
  console.log('Keyword detection - received text:', text);
  console.log('Keyword detection - text length:', text ? text.length : 0);
  
  if (!text || !text.trim()) {
    console.log('Keyword detection - empty text, returning neutral');
    return { emotion: 'neutral', score: 0.5 };
  }

  const lowerText = text.toLowerCase();
  console.log('Keyword detection - lowercase text:', lowerText);
  
  // Enhanced keyword matching with higher confidence (English + Urdu)
  if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('worry') || 
      lowerText.includes('worried') || lowerText.includes('stress') || lowerText.includes('nervous') ||
      // Urdu keywords for anxiety/worry
      text.includes('پریشان') || text.includes('فکر') || text.includes('گھبرا') || text.includes('بے چین') ||
      text.includes('پریشانی') || text.includes('تشویش') || text.includes('خوف زدہ')) {
    console.log('Keyword detection - found anxiety keywords');
    return { emotion: 'anxious', score: 0.85 };
  } else if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('depression') ||
             lowerText.includes('down') || lowerText.includes('upset') || lowerText.includes('crying') ||
             // Urdu keywords for sadness
             text.includes('اداس') || text.includes('غمگین') || text.includes('افسرده') || text.includes('رو') || 
             text.includes('رونا') || text.includes('غم') || text.includes('دکھ') || text.includes('اداسی')) {
    console.log('Keyword detection - found sadness keywords');
    return { emotion: 'sad', score: 0.85 };
  } else if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('joyful') ||
             lowerText.includes('great') || lowerText.includes('wonderful') || lowerText.includes('amazing') ||
             lowerText.includes('excited') || lowerText.includes('cheerful') ||
             // Urdu keywords for happiness
             text.includes('خوش') || text.includes('خوشی') || text.includes('مسرور') || text.includes('شاد') ||
             text.includes('خوشگوار') || text.includes('بہتر') || text.includes('اچھا')) {
    console.log('Keyword detection - found happiness keywords');
    return { emotion: 'happy', score: 0.85 };
  } else if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('furious') ||
             lowerText.includes('frustrated') || lowerText.includes('irritated') || lowerText.includes('annoyed') ||
             // Urdu keywords for anger
             text.includes('غصہ') || text.includes('غضب') || text.includes('ناراض') || text.includes('برا') ||
             text.includes('چڑچڑا') || text.includes('جھنجھلا') || text.includes('کراہت')) {
    console.log('Keyword detection - found anger keywords');
    return { emotion: 'angry', score: 0.85 };
  } else if (lowerText.includes('overwhelm') || lowerText.includes('too much') || lowerText.includes('can\'t handle') ||
             lowerText.includes('exhausted') || lowerText.includes('burned out') ||
             // Urdu keywords for overwhelmed
             text.includes('تھکا') || text.includes('تھکاوٹ') || text.includes('بہت زیادہ') || text.includes('برداشت نہیں') ||
             text.includes('ہار گیا') || text.includes('مغلوب') || text.includes('بے بس')) {
    console.log('Keyword detection - found overwhelmed keywords');
    return { emotion: 'overwhelmed', score: 0.85 };
  } else if (lowerText.includes('afraid') || lowerText.includes('scared') || lowerText.includes('fear') ||
             lowerText.includes('terrified') || lowerText.includes('frightened') ||
             // Urdu keywords for fear
             text.includes('ڈر') || text.includes('خوف') || text.includes('گھبرا') || text.includes('بوجھل') ||
             text.includes('ڈرا') || text.includes('خائف') || text.includes('سہمے')) {
    console.log('Keyword detection - found fear keywords');
    return { emotion: 'fearful', score: 0.85 };
  } else if (lowerText.includes('lonely') || lowerText.includes('alone') || lowerText.includes('isolated') ||
             // Urdu keywords for loneliness
             text.includes('اکیلا') || text.includes('تنہا') || text.includes('علیحدگی') ||
             text.includes('تنہائی') || text.includes('الگ') || text.includes('اکیلے پن')) {
    console.log('Keyword detection - found loneliness keywords');
    return { emotion: 'lonely', score: 0.85 };
  } else if (lowerText.includes('confused') || lowerText.includes('lost') || lowerText.includes('uncertain') ||
             // Urdu keywords for confusion (note: پریشان is also in anxiety, but context matters)
             text.includes('کنفیوز') || text.includes('سمجھ نہیں') || text.includes('الجھن') ||
             text.includes('بے یقین') || text.includes('شک') || text.includes('حیران')) {
    console.log('Keyword detection - found confusion keywords');
    return { emotion: 'confused', score: 0.80 };
  }
  
  // Check for positive indicators (English + Urdu)
  if (lowerText.includes('good') || lowerText.includes('fine') || lowerText.includes('okay') ||
      lowerText.includes('alright') || lowerText.includes('well') ||
      text.includes('ٹھیک') || text.includes('اچھا') || text.includes('بہتر') ||
      text.includes('ٹھیک ہے') || text.includes('بہت اچھا') || text.includes('خوب')) {
    console.log('Keyword detection - found positive keywords');
    return { emotion: 'content', score: 0.70 };
  }
  
  console.log('Keyword detection - no keywords matched, returning neutral');
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
