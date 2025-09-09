import OpenAI from "openai";

// Type definitions
interface SpeechFeedback {
  accuracy: number;
  feedback: string;
  suggestions?: string[];
  phoneticAnalysis?: string;
  improvements?: string[];
}

// Phase 4: Use gpt-4o-mini for cost efficiency as specified in 2025 recommendations
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

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

