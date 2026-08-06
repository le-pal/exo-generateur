import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { findKeyByProvider } from '../repositories/apiKeyRepository.js';
import { findByName } from '../repositories/promptRepository.js';
import { AppError } from '../types/index.js';
import { getProvider } from '../data/models.js';
import { writeLog } from './logger.js';
import type {
  LlmProvider,
  Difficulty,
  ExerciseType,
  ImagePayload,
  LlmGenerationResult,
  LlmCorrectionResult,
} from '../types/index.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

function resolveApiKey(provider: LlmProvider): string {
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

function extractErrorMessage(err: unknown): string {
  if (typeof err !== 'object' || err === null) return String(err);
  const e = err as Record<string, unknown>;
  const nested = (e['error'] as Record<string, unknown> | undefined);
  if (nested) {
    const inner = (nested['error'] as Record<string, unknown> | undefined);
    if (typeof inner?.['message'] === 'string') return inner['message'];
    if (typeof nested['message'] === 'string') return nested['message'];
  }
  if (typeof e['message'] === 'string') return e['message'].replace(/^\d{3} /, '');
  return 'Erreur inconnue';
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function callClaude(apiKey: string, modelId: string, promptText: string, images: ImagePayload[]): Promise<string> {
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
    model: modelId,
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  });
  return (message.content[0] as Anthropic.TextBlock).text;
}

async function callGemini(apiKey: string, modelId: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });
  const parts = [
    ...images.map(img => ({ inlineData: { mimeType: img.mediaType, data: img.data } })),
    { text: promptText },
  ];
  const result = await model.generateContent(parts);
  return result.response.text();
}

async function callOpenRouter(apiKey: string, modelId: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = images.map(img => ({
    type: 'image_url',
    image_url: { url: `data:${img.mediaType};base64,${img.data}` },
  }));
  content.push({ type: 'text', text: promptText });

  const body = {
    model: modelId,
    max_tokens: 4096,
    messages: [{ role: 'user', content: images.length > 0 ? content : promptText }],
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://exo-generateur.scheffer.top',
      'X-Title': 'Exo Generateur',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new AppError(`OpenRouter error (${res.status}): ${errText.slice(0, 300)}`, 502);
  }

  const json = await res.json() as { choices: Array<{ message: { content: string } }> };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new AppError('OpenRouter: réponse vide ou malformée', 502);
  return text;
}

async function callProvider(modelId: string, apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const provider = getProvider(modelId);
  if (provider === 'gemini') return callGemini(apiKey, modelId, promptText, images);
  if (provider === 'openrouter') return callOpenRouter(apiKey, modelId, promptText, images);
  return callClaude(apiKey, modelId, promptText, images);
}

// ── Instrumented call with logging ────────────────────────────────────────────

async function callWithLog(
  operation: 'generation' | 'correction',
  modelId: string,
  promptText: string,
  images: ImagePayload[],
): Promise<string> {
  const provider = getProvider(modelId);
  const apiKey = resolveApiKey(provider);
  const start = Date.now();
  try {
    const response = await callProvider(modelId, apiKey, promptText, images);
    writeLog({
      timestamp: new Date().toISOString(),
      operation,
      provider,
      model: modelId,
      duration_ms: Date.now() - start,
      success: true,
      prompt_length: promptText.length,
      response_length: response.length,
      prompt: promptText,
      response,
    });
    return response;
  } catch (err) {
    writeLog({
      timestamp: new Date().toISOString(),
      operation,
      provider,
      model: modelId,
      duration_ms: Date.now() - start,
      success: false,
      error: extractErrorMessage(err),
      prompt_length: promptText.length,
      response_length: 0,
      prompt: promptText,
    });
    throw err;
  }
}

// ── Provider test ─────────────────────────────────────────────────────────────

export interface TestResult {
  ok: boolean;
  error?: string;
}

export async function testProvider(provider: LlmProvider, apiKey: string): Promise<TestResult> {
  try {
    if (provider === 'claude') {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
    } else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      await model.generateContent('Say "ok"');
    } else {
      // OpenRouter: delegate to openrouterService
      const { testOpenRouterKey } = await import('./openrouterService.js');
      return testOpenRouterKey(apiKey);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err) };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

interface GenerateExercisesInput {
  model: string;
  subject: string;
  level: string;
  topic: string;
  difficulty: Difficulty;
  numExercises: number;
  uploadedContent: string;
  images: ImagePayload[];
}

interface CorrectExercisesInput {
  model: string;
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
  const template = resolvePromptTemplate('generation');
  const promptText = renderTemplate(template, {
    subject, level, topic, difficulty,
    num_exercises: numExercises,
    uploaded_content: uploadedContent,
  });
  const raw = await callWithLog('generation', model, promptText, images);
  return parseJsonResponse<LlmGenerationResult>(raw);
}

export async function correctExercises(input: CorrectExercisesInput): Promise<LlmCorrectionResult> {
  const { model, subject, level, exercisesAndAnswers } = input;
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
  const raw = await callWithLog('correction', model, promptText, []);
  return parseJsonResponse<LlmCorrectionResult>(raw);
}
