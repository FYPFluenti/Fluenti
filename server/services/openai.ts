import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  supportType: string;
  response: string;
}

export interface SpeechFeedback {
  accuracy: number;
  feedback: string;
  phoneticAnalysis: string;
  improvements: string[];
}

export async function analyzeEmotion(message: string, voiceTone?: string): Promise<EmotionAnalysis> {
  try {
    const prompt = `Analyze the emotional state of this message${voiceTone ? ' and voice tone' : ''}. 
    Message: "${message}"
    ${voiceTone ? `Voice tone description: "${voiceTone}"` : ''}
    
    Provide emotional support and determine the type of support needed. Respond with JSON in this format:
    {
      "emotion": "detected emotion (e.g., anxiety, stress, sadness, anger, neutral, happy)",
      "confidence": confidence_score_0_to_1,
      "supportType": "type of support (e.g., cbt, breathing, validation, crisis)",
      "response": "empathetic and helpful response message"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compassionate AI therapist specializing in emotional support. Provide evidence-based responses using CBT techniques when appropriate. Always be empathetic and never provide medical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      emotion: result.emotion || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      supportType: result.supportType || 'validation',
      response: result.response || 'I understand you might be going through something difficult. Would you like to talk about it?'
    };
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    return {
      emotion: 'neutral',
      confidence: 0.5,
      supportType: 'validation',
      response: 'I\'m here to listen and support you. How are you feeling right now?'
    };
  }
}

export async function generateSpeechFeedback(
  word: string, 
  phonetic: string, 
  userTranscription: string,
  language: 'english' | 'urdu'
): Promise<SpeechFeedback> {
  try {
    const prompt = `Analyze speech pronunciation for language learning.
    Target word: "${word}"
    Phonetic (IPA): "${phonetic}"
    User's spoken transcription: "${userTranscription}"
    Language: ${language}
    
    Provide detailed pronunciation feedback. Respond with JSON in this format:
    {
      "accuracy": accuracy_percentage_0_to_100,
      "feedback": "specific feedback about pronunciation",
      "phoneticAnalysis": "phonetic breakdown of user's pronunciation",
      "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a speech therapy AI assistant specializing in ${language} pronunciation. Provide constructive, encouraging feedback for speech therapy exercises.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      accuracy: Math.max(0, Math.min(100, result.accuracy || 70)),
      feedback: result.feedback || 'Good attempt! Keep practicing.',
      phoneticAnalysis: result.phoneticAnalysis || phonetic,
      improvements: Array.isArray(result.improvements) ? result.improvements : ['Continue practicing regularly']
    };
  } catch (error) {
    console.error("Error generating speech feedback:", error);
    return {
      accuracy: 70,
      feedback: 'Keep practicing! Your pronunciation is improving.',
      phoneticAnalysis: phonetic,
      improvements: ['Continue practicing regularly', 'Focus on clear enunciation']
    };
  }
}

export async function generatePersonalizedExercises(
  userLevel: number,
  language: 'english' | 'urdu' | 'both',
  previousAccuracy?: number,
  problemAreas?: string[]
): Promise<any[]> {
  try {
    const prompt = `Generate personalized speech therapy exercises.
    User level: ${userLevel}
    Language preference: ${language}
    Previous accuracy: ${previousAccuracy || 'N/A'}%
    Problem areas: ${problemAreas?.join(', ') || 'None specified'}
    
    Create 5-10 appropriate exercises focusing on the user's needs. Respond with JSON in this format:
    {
      "exercises": [
        {
          "id": "unique_id",
          "type": "pronunciation|fluency|vocabulary",
          "difficulty": 1-5,
          "word": "target word",
          "phonetic": "IPA transcription",
          "sentence": "example sentence using the word",
          "language": "english|urdu"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a speech therapy curriculum designer. Create engaging, progressive exercises suitable for the user's level and needs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.exercises || [];
  } catch (error) {
    console.error("Error generating exercises:", error);
    return [];
  }
}
