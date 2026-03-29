import * as sessionRepo from '../repositories/sessionRepository.js';
import * as exerciseRepo from '../repositories/exerciseRepository.js';
import * as answerRepo from '../repositories/answerRepository.js';
import * as studentRepo from '../repositories/studentRepository.js';
import * as settingsRepo from '../repositories/settingsRepository.js';
import { generateExercises, correctExercises } from './llm.js';

/** Assembles a full session object with parsed exercises and their answers. */
function buildSessionView(session) {
  const exercises = exerciseRepo.findBySessionId(session.id).map(ex => ({
    ...ex,
    options: ex.options ? JSON.parse(ex.options) : null,
    answer: answerRepo.findByExerciseId(ex.id),
  }));
  return { ...session, exercises };
}

export function getSession(id) {
  const session = sessionRepo.findById(id);
  if (!session) throw Object.assign(new Error('Session introuvable'), { status: 404 });
  return buildSessionView(session);
}

export async function generateSession({ student_id, subject, topic, difficulty, num_exercises, model, images, uploadedText }) {
  if (!student_id || !subject || !topic?.trim()) {
    throw Object.assign(new Error('student_id, subject et topic sont requis'), { status: 400 });
  }

  const student = studentRepo.findById(student_id);
  if (!student) throw Object.assign(new Error('Élève introuvable'), { status: 404 });

  const defaultModel = settingsRepo.findByKey('default_model') ?? 'claude';
  const selectedModel = model || defaultModel;

  const llmResult = await generateExercises({
    model: selectedModel,
    subject,
    level: student.level,
    topic,
    difficulty: difficulty ?? 'normal',
    numExercises: parseInt(num_exercises) || 5,
    uploadedContent: uploadedText ?? '',
    images: images ?? [],
  });

  if (!Array.isArray(llmResult.exercises)) {
    throw Object.assign(new Error('Réponse LLM invalide'), { status: 502 });
  }

  const session = sessionRepo.create({
    student_id,
    subject,
    topic,
    difficulty: difficulty ?? 'normal',
    num_exercises: parseInt(num_exercises) || 5,
    model: selectedModel,
  });

  exerciseRepo.createMany(session.id, llmResult.exercises);

  return buildSessionView(session);
}

export function saveAnswer(sessionId, exerciseId, studentAnswer) {
  const exercise = exerciseRepo.findByIdAndSessionId(exerciseId, sessionId);
  if (!exercise) throw Object.assign(new Error('Exercice introuvable'), { status: 404 });
  answerRepo.upsert(exercise.id, studentAnswer ?? '');
  sessionRepo.touch(sessionId);
}

export async function correctSession(sessionId) {
  const session = sessionRepo.findById(sessionId);
  if (!session) throw Object.assign(new Error('Session introuvable'), { status: 404 });

  const student = studentRepo.findById(session.student_id);
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
    throw Object.assign(new Error('Réponse de correction LLM invalide'), { status: 502 });
  }

  answerRepo.bulkCorrect(llmResult.corrections);
  sessionRepo.updateStatus(sessionId, 'corrected');

  return buildSessionView(sessionRepo.findById(sessionId));
}

export function completeSession(sessionId) {
  const session = sessionRepo.findById(sessionId);
  if (!session) throw Object.assign(new Error('Session introuvable'), { status: 404 });
  sessionRepo.updateStatus(sessionId, 'completed');
}
