/**
 * Game Type Definitions
 * Common types used across all therapeutic games
 */

// Re-export therapeutic types
export * from './therapeutic';

export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameCategory = 'pronunciation' | 'fluency' | 'articulation' | 'listening' | 'reading';
export type GameType = 'interactive' | 'browser-game' | 'api-game';
export type TherapyType = 'general' | 'autism' | 'apraxia';

export interface Game {
  id: number;
  title: string;
  description: string;
  emoji: string;
  difficulty: GameDifficulty;
  duration: string;
  stars: number;
  xpReward: number;
  color: string;
  unlocked: boolean;
  category: string;
  type: GameType;
  therapyType?: TherapyType;
  minLevel?: number;
}

export interface GameSession {
  gameId: number;
  startTime: Date;
  currentLevel: number;
  score: number;
  wordsCompleted: string[];
  accuracy: number;
}

export interface Word {
  word: string;
  phonetic: string;
  difficulty: number;
  image: string;
  syllables?: number;
  category?: string;
}

export interface GameResult {
  score: number;
  accuracy: number;
  wordsCompleted: number;
  timeSpent: number;
  stars: number;
  xpEarned: number;
}

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  stars: number;
  streak: number;
  gamesCompleted: number;
  totalTimeSpent: number;
  averageAccuracy: number;
}

export interface TherapeuticGameProps {
  gameId: number;
  onGameEnd: (score: number, accuracy: number) => void;
  difficulty?: GameDifficulty;
  soundEnabled?: boolean;
  userId?: string;
}

export interface AutismGameProps extends TherapeuticGameProps {
  sensoryLevel?: 'low' | 'medium' | 'high';
  visualSupport?: boolean;
  audioSupport?: boolean;
}

export interface ApraxiaGameProps extends TherapeuticGameProps {
  repetitions?: number;
  feedbackType?: 'visual' | 'audio' | 'tactile' | 'all';
  modelingSpeed?: 'slow' | 'normal' | 'fast';
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface TherapySession {
  id: string;
  userId: string;
  gameId: number;
  therapyType: TherapyType;
  startTime: Date;
  endTime?: Date;
  results: GameResult;
  notes?: string;
}
