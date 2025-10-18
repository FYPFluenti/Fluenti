

interface ChildProfile {
  childName?: string;
  childBirthYear?: number;
  childGender?: 'girl' | 'boy';
  interests?: string[];
  vocabularyLevel?: string;
  assessmentResponses?: {
    hearing?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    pragmatics?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    play?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    comprehension?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
  };
  seekingSpeechTherapy?: boolean;
  hasBeenEvaluated?: boolean;
}

interface PersonalizedWord {
  word: string;
  phonetic: string;
  phonemes: string[];
  difficulty: number;
  category: string;
  targetSounds: string[];
  visualCue?: string;
  therapyFocus: string;
}

interface SpeechFeedback {
  message: string;
  encouragement: string;
  technicalTip?: string;
  emotionalTone: 'excited' | 'encouraging' | 'supportive' | 'proud';
  nextSteps?: string;
}

class AISpeechTherapyService {

  constructor() {
    // No longer need direct OpenAI client - using server-side API
  }

  async generatePersonalizedWords(childProfile: ChildProfile, sessionType: 'practice' | 'assessment' = 'practice'): Promise<PersonalizedWord[]> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/games/generate-words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Use httpOnly cookies for auth
          body: JSON.stringify({
            childProfile,
            sessionType
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.words || [];
        } else if (response.status === 401) {
          // Token expired, try to refresh
          console.warn('Token expired during word generation, attempting to refresh...');
          await this.refreshAuthToken();
          retryCount++;
          continue;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`Error generating personalized words (attempt ${retryCount}):`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error('Unable to generate personalized words after multiple attempts. Please refresh the page.');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Unable to generate personalized words. Please check your internet connection and try again.');
  }

  async generateEncouragingFeedback(
    childName: string,
    targetWord: string,
    userAttempt: string,
    accuracy: number,
    attemptNumber: number,
    childAge: number,
    interests?: string[]
  ): Promise<SpeechFeedback> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/games/generate-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Use httpOnly cookies for auth
          body: JSON.stringify({
            childName,
            targetWord,
            userAttempt,
            accuracy,
            attemptNumber,
            childAge,
            interests
          })
        });

        if (response.ok) {
          const feedback = await response.json();
          return feedback;
        } else if (response.status === 401) {
          // Token expired, try to refresh
          console.warn('Token expired, attempting to refresh...');
          await this.refreshAuthToken();
          retryCount++;
          continue;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`Error generating AI feedback (attempt ${retryCount}):`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error('Unable to generate AI feedback after multiple attempts. Please refresh the page.');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Unable to generate AI feedback. Please try again.');
  }

  private async refreshAuthToken(): Promise<void> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('✅ Auth token refreshed successfully');
        // No need to store token in localStorage - using httpOnly cookies
      } else {
        console.warn('❌ Failed to refresh token, user may need to log in again');
        // Redirect to login or show error
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      window.location.href = '/login';
    }
  }

  async generateSessionSummary(
    childName: string,
    wordsAttempted: number,
    wordsCompleted: number,
    averageAccuracy: number,
    totalScore: number,
    childAge: number,
    interests?: string[]
  ): Promise<{
    title: string;
    message: string;
    achievements: string[];
    encouragement: string;
    nextGoals: string[];
  }> {
    try {
      const response = await fetch('/api/games/generate-session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({
          childName,
          wordsAttempted,
          wordsCompleted,
          averageAccuracy,
          totalScore,
          childAge,
          interests
        })
      });

      if (response.ok) {
        const summary = await response.json();
        return summary;
      } else {
        throw new Error('Failed to generate session summary from server');
      }
    } catch (error) {
      console.error('Error generating session summary:', error);
      // No hardcoded fallback - throw error to be handled by the component
      throw new Error('Unable to generate AI session summary. Please try again.');
    }
  }




}

export const aiSpeechService = new AISpeechTherapyService();
export type { PersonalizedWord, SpeechFeedback, ChildProfile };