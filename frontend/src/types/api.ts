// Domain types mirroring the backend API responses

export type SessionStatus = 'in_progress' | 'completed' | 'corrected';
export type LlmModel = 'claude' | 'gemini';
export type Difficulty = 'facile' | 'normal' | 'difficile';
export type ExerciseType = 'mcq' | 'text' | 'number' | 'fill_blank';

export interface Student {
  id: number;
  name: string;
  level: string;
  created_at: string;
  updated_at: string;
}

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

export interface Answer {
  id: number;
  exercise_id: number;
  student_answer: string | null;
  is_correct: 0 | 1 | null;
  score: number | null;
  correction: string | null;
  submitted_at: string | null;
}

export interface ExerciseView {
  id: number;
  session_id: number;
  order_num: number;
  type: ExerciseType;
  question: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  answer: Answer | null;
}

export interface SessionView extends Session {
  exercises: ExerciseView[];
}

export interface StudentSessionSummary extends Session {
  exercise_count: number;
  correct_count: number;
}

export interface Prompt {
  id: number;
  name: string;
  type: 'generation' | 'correction';
  content: string;
  description: string | null;
  updated_at: string;
}

export interface ApiKeyInfo {
  provider: string;
  active: 0 | 1;
  updated_at: string;
  is_set: 0 | 1;
}

export interface Level {
  value: string;
  label: string;
  group: 'Primaire' | 'Collège' | 'Lycée';
}

export interface Subject {
  value: string;
  label: string;
  levels: 'all' | string[];
}

export interface DifficultyOption {
  value: string;
  label: string;
}

export interface ReferenceData {
  levels: Level[];
  subjects: Subject[];
  difficulties: DifficultyOption[];
}
