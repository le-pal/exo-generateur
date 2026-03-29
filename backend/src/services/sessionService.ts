import * as sessionRepo from '../repositories/sessionRepository.js';
import * as exerciseRepo from '../repositories/exerciseRepository.js';
import * as answerRepo from '../repositories/answerRepository.js';
import * as studentRepo from '../repositories/studentRepository.js';
import * as settingsRepo from '../repositories/settingsRepository.js';
import { generateExercises, correctExercises } from './llm.js';
import { AppError } from '../types/index.js';
import type {
  SessionView,
  ExerciseView,
  LlmModel,
  Difficulty,
  ImagePayload,
} from '../types/index.js';

interface GenerateSessionInput {
  student_id: number;
  subject: string;
  topic: string;
  difficulty?: Difficulty;
  num_exercises?: number;
  model?: LlmModel;
  images?: ImagePayload[];
  uploadedText?: string;
}

function buildSessionView(sessionId: number): SessionView {
  const session = sessionRepo.findById(sessionId)!;
  const exercises: ExerciseView[] = exerciseRepo.findBySessionId(sessionId).map(ex => ({
    ...ex,
    options: ex.options ? (JSON.parse(ex.options) as string[]) : null,
    answer: answerRepo.findByExerciseId(ex.id),
  }));
  return { ...session, exercises };
}

export function getSession(id: number): SessionView {
  if (!sessionRepo.findById(id)) throw new AppError('Session introuvable', 404);
  return buildSessionView(id);
}

export async function generateSession(input: GenerateSessionInput): Promise<SessionView> {
  const { student_id, subject, topic, difficulty = 'normal', num_exercises = 5, model, images = [], uploadedText = '' } = input;

  if (!student_id || !subject || !topic?.trim()) {
    throw new AppError('student_id, subject et topic sont requis', 400);
  }

  const student = studentRepo.findById(student_id);
  if (!student) throw new AppError('Élève introuvable', 404);

  const defaultModel = (settingsRepo.findByKey('default_model') ?? 'claude') as LlmModel;
  const selectedModel: LlmModel = model ?? defaultModel;

  const llmResult = await generateExercises({
    model: selectedModel,
    subject,
    level: student.level,
    topic,
    difficulty,
    numExercises: num_exercises,
    uploadedContent: uploadedText,
    images,
  });

  if (!Array.isArray(llmResult.exercises)) {
    throw new AppError('Réponse LLM invalide', 502);
  }

  const session = sessionRepo.create({ student_id, subject, topic, difficulty, num_exercises, model: selectedModel });
  exerciseRepo.createMany(session.id, llmResult.exercises);

  return buildSessionView(session.id);
}

export function saveAnswer(sessionId: number, exerciseId: number, studentAnswer: string): void {
  const exercise = exerciseRepo.findByIdAndSessionId(exerciseId, sessionId);
  if (!exercise) throw new AppError('Exercice introuvable', 404);
  answerRepo.upsert(exercise.id, studentAnswer ?? '');
  sessionRepo.touch(sessionId);
}

export async function correctSession(sessionId: number): Promise<SessionView> {
  const session = sessionRepo.findById(sessionId);
  if (!session) throw new AppError('Session introuvable', 404);

  const student = studentRepo.findById(session.student_id)!;
  const exercises = exerciseRepo.findBySessionId(sessionId);

  const exercisesAndAnswers = exercises.map(ex => ({
    exercise_id: ex.id,
    type: ex.type,
    question: ex.question,
    correct_answer: ex.correct_answer,
    student_answer: answerRepo.findByExerciseId(ex.id)?.student_answer ?? null,
  }));

  const llmResult = await correctExercises({
    model: session.model,
    subject: session.subject,
    level: student.level,
    exercisesAndAnswers,
  });

  if (!Array.isArray(llmResult.corrections)) {
    throw new AppError('Réponse de correction LLM invalide', 502);
  }

  answerRepo.bulkCorrect(llmResult.corrections);
  sessionRepo.updateStatus(sessionId, 'corrected');

  return buildSessionView(sessionId);
}

export function completeSession(sessionId: number): void {
  if (!sessionRepo.findById(sessionId)) throw new AppError('Session introuvable', 404);
  sessionRepo.updateStatus(sessionId, 'completed');
}
