/**
 * Therapeutic Game Type Definitions
 * Comprehensive types for speech therapy and therapeutic games
 */

export interface TherapeuticGame {
  id: number;
  title: string;
  description: string;
  category: 'articulation' | 'phonological' | 'fluency' | 'language' | 'pragmatic' | 'sensory';
  targetAudience: 'autism' | 'speech-delay' | 'apraxia' | 'stuttering' | 'all';
  evidenceLevel: 'research-backed' | 'clinical-proven' | 'expert-recommended';
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: string;
  unlocked: boolean;
  therapeutic_goals: string[];
  age_range: string;
  icon: string;
  color: string;
  game_type: 'interactive' | 'visual-sequence' | 'auditory-processing' | 'social-communication';
}

export interface GameSession {
  gameId: number;
  userId: string;
  startTime: Date;
  endTime?: Date;
  responses: GameResponse[];
  accuracy: number;
  reaction_times: number[];
  therapeutic_data: TherapeuticData;
  completed: boolean;
}

export interface GameResponse {
  questionId: string;
  userResponse: any;
  correctResponse: any;
  isCorrect: boolean;
  reactionTime: number;
  timestamp: Date;
}

export interface TherapeuticData {
  category: string;
  phonemesWorked: string[];
  improvementAreas: string[];
  strengthAreas: string[];
  recommendations: string[];
}

export interface UserProgress {
  userId: string;
  articulation_score: number;
  phonological_awareness: number;
  language_comprehension: number;
  social_communication: number;
  sessions_completed: number;
  level: number;
  lastSession: Date;
  totalPracticeTime: number;
}
