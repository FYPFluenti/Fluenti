// OpenAI service disabled as per user request - only STT and TTS functionality needed

// Type definitions kept for compatibility
interface SpeechFeedback {
  accuracy: number;
  feedback: string;
  suggestions?: string[];
  phoneticAnalysis?: string;
  improvements?: string[];
}

// Placeholder function that returns basic feedback without AI
export async function generateSpeechFeedback(
  word: string, 
  phonetic: string, 
  userTranscription: string,
  language: 'english' | 'urdu'
): Promise<SpeechFeedback> {
  // Simple non-AI feedback
  return {
    accuracy: 85,
    feedback: `Practice attempt recorded for word: ${word}`,
    phoneticAnalysis: `Target: ${phonetic}, Spoken: ${userTranscription}`,
    improvements: ["Keep practicing", "Focus on pronunciation"]
  };
}