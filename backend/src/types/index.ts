// ── Domain entities (as stored in DB) ────────────────────────────────────────

export interface Student {
  id: number;
  name: string;
  level: string;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = 'in_progress' | 'completed' | 'corrected';
export type LlmModel = 'claude' | 'gemini';
export type Difficulty = 'facile' | 'normal' | 'difficile';
export type ExerciseType = 'mcq' | 'text' | 'number' | 'fill_blank';

export interface Session {
  id: number;
  student_id: number;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  num_exercises: number;
  model: LlmModel;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  session_id: number;
  order_num: number;
  type: ExerciseType;
  question: string;
  /** Raw JSON string in DB */
  options: string | null;
  correct_answer: string;
  points: number;
}

export interface Answer {
  id: number;
  exercise_id: number;
  student_answer: string | null;
  /** SQLite stores booleans as 0/1 */
  is_correct: 0 | 1 | null;
  score: number | null;
  correction: string | null;
  submitted_at: string | null;
}

export interface Prompt {
  id: number;
  name: string;
  type: 'generation' | 'correction';
  content: string;
  description: string | null;
  updated_at: string;
}

export interface ApiKeyRow {
  provider: string;
  active: 0 | 1;
  updated_at: string;
  /** 1 if key is set, 0 otherwise — raw key never exposed */
  is_set: 0 | 1;
}

// ── View types (returned to clients) ─────────────────────────────────────────

export interface ExerciseView extends Omit<Exercise, 'options'> {
  options: string[] | null;
  answer: Answer | null;
}

export interface SessionView extends Session {
  exercises: ExerciseView[];
}

export interface StudentSessionSummary extends Session {
  exercise_count: number;
  correct_count: number;
}

// ── LLM types ─────────────────────────────────────────────────────────────────

export interface LlmExercise {
  type: ExerciseType;
  question: string;
  options: string[] | null;
  correct_answer: string;
  points?: number;
}

export interface LlmGenerationResult {
  exercises: LlmExercise[];
}

export interface LlmCorrection {
  exercise_id: number;
  is_correct: boolean;
  score: number;
  explanation: string;
}

export interface LlmCorrectionResult {
  corrections: LlmCorrection[];
}

export interface ImagePayload {
  mediaType: string;
  data: string; // base64
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(message: string, public readonly status: number = 500) {
    super(message);
    this.name = 'AppError';
  }
}
