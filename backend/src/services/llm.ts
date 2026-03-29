import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { findKeyByProvider } from '../repositories/apiKeyRepository.js';
import { findByName } from '../repositories/promptRepository.js';
import { AppError } from '../types/index.js';
import type {
  LlmModel,
  Difficulty,
  ExerciseType,
  ImagePayload,
  LlmGenerationResult,
  LlmCorrectionResult,
} from '../types/index.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

function resolveApiKey(provider: LlmModel): string {
  const key = findKeyByProvider(provider);
  if (!key) throw new AppError(`Clé API ${provider} non configurée`, 503);
  return key;
}

function resolvePromptTemplate(name: string): string {
  const prompt = findByName(name);
  if (!prompt) throw new AppError(`Prompt "${name}" introuvable`, 500);
  return prompt.content;
}

function renderTemplate(template: string, vars: Record<string, unknown>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(val ?? ''));
  }
  result = result.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, block: string) => (vars[key] ? block : ''),
  );
  return result;
}

function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function callClaude(apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const client = new Anthropic({ apiKey });
  const content: Anthropic.MessageParam['content'] = [
    ...images.map(
      img =>
        ({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType as Anthropic.Base64ImageSource['media_type'], data: img.data },
        }) satisfies Anthropic.ImageBlockParam,
    ),
    { type: 'text', text: promptText } satisfies Anthropic.TextBlockParam,
  ];
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  });
  return (message.content[0] as Anthropic.TextBlock).text;
}

async function callGemini(apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const parts = [
    ...images.map(img => ({ inlineData: { mimeType: img.mediaType, data: img.data } })),
    { text: promptText },
  ];
  const result = await model.generateContent(parts);
  return result.response.text();
}

function callProvider(provider: LlmModel, apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  return provider === 'gemini'
    ? callGemini(apiKey, promptText, images)
    : callClaude(apiKey, promptText, images);
}

// ── Public API ────────────────────────────────────────────────────────────────

interface GenerateExercisesInput {
  model: LlmModel;
  subject: string;
  level: string;
  topic: string;
  difficulty: Difficulty;
  numExercises: number;
  uploadedContent: string;
  images: ImagePayload[];
}

interface CorrectExercisesInput {
  model: LlmModel;
  subject: string;
  level: string;
  exercisesAndAnswers: {
    exercise_id: number;
    type: ExerciseType;
    question: string;
    correct_answer: string;
    student_answer: string | null;
  }[];
}

export async function generateExercises(input: GenerateExercisesInput): Promise<LlmGenerationResult> {
  const { model, subject, level, topic, difficulty, numExercises, uploadedContent, images } = input;
  const apiKey = resolveApiKey(model);
  const template = resolvePromptTemplate('generation');
  const promptText = renderTemplate(template, {
    subject, level, topic, difficulty,
    num_exercises: numExercises,
    uploaded_content: uploadedContent,
  });
  const raw = await callProvider(model, apiKey, promptText, images);
  return parseJsonResponse<LlmGenerationResult>(raw);
}

export async function correctExercises(input: CorrectExercisesInput): Promise<LlmCorrectionResult> {
  const { model, subject, level, exercisesAndAnswers } = input;
  const apiKey = resolveApiKey(model);
  const template = resolvePromptTemplate('correction');
  const formatted = exercisesAndAnswers
    .map(
      (ea, i) =>
        `Exercice ${i + 1} (id: ${ea.exercise_id}, type: ${ea.type}) :\n` +
        `Question : ${ea.question}\n` +
        `Réponse attendue : ${ea.correct_answer}\n` +
        `Réponse de l'élève : ${ea.student_answer ?? '(pas de réponse)'}`,
    )
    .join('\n---\n');
  const promptText = renderTemplate(template, { subject, level, exercises_and_answers: formatted });
  const raw = await callProvider(model, apiKey, promptText, []);
  return parseJsonResponse<LlmCorrectionResult>(raw);
}
