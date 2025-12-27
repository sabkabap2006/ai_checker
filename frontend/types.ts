export interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timestamp: number;
}

export interface EvaluationResult {
  score: number; // 0-100
  spellingErrors: string[];
  technicalAccuracy: string;
  improvedAnswer: string;
  keyConceptsMissed: string[];
  isCorrect: boolean;
}

export interface Attempt {
  id: string;
  question: Question;
  userAnswer: string;
  evaluation: EvaluationResult;
  timestamp: number;
}

export interface UserFeedback {
  id: string;
  attemptId: string;
  rating: number; // 1-5 stars
  comment?: string;
  timestamp: number;
}

// Enum for API States
export enum Status {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// For simulation of the requested backend structure
export interface MockDatabase {
  attempts: Attempt[];
}
