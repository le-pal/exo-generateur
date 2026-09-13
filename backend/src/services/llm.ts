import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { findKeyByProvider } from '../repositories/apiKeyRepository.js';
import { findByName } from '../repositories/promptRepository.js';
import * as exchangeRepo from '../repositories/exchangeRepository.js';
import { AppError } from '../types/index.js';
import { getProvider } from '../data/models.js';
import { getTopicContext } from '../data/curriculum.js';
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

/**
 * Extracts a human-readable message from provider SDK errors.
 * Anthropic: err.error.error.message  (nested)
 * Gemini: err.message or err.errorDetails[].message
 */
function extractErrorMessage(err: unknown): string {
  if (typeof err !== 'object' || err === null) return String(err);
  const e = err as Record<string, unknown>;

  // Anthropic SDK: { error: { error: { message } } }
  const nested = (e['error'] as Record<string, unknown> | undefined);
  if (nested) {
    const inner = (nested['error'] as Record<string, unknown> | undefined);
    if (typeof inner?.['message'] === 'string') return inner['message'];
    if (typeof nested['message'] === 'string') return nested['message'];
  }

  // Gemini SDK: { message, errorDetails }
  if (typeof e['message'] === 'string') {
    // Strip leading "XXX " status prefix if present, e.g. "400 Bad Request"
    return e['message'].replace(/^\d{3} /, '');
  }

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
  const content = [
    { type: 'text', text: promptText },
    ...images.map(img => ({ type: 'image_url', image_url: { url: `data:${img.mediaType};base64,${img.data}` } })),
  ];
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://exo.scheffer.top',
      'X-Title': 'Exo Générateur',
    },
    body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content }] }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status} : ${body.slice(0, 500)}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Réponse OpenRouter vide');
  return text;
}

// ── OpenRouter model catalog ─────────────────────────────────────────────────

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
}

let openRouterModelsCache: { models: OpenRouterModel[]; fetchedAt: number } | null = null;
const OPENROUTER_MODELS_TTL_MS = 60 * 60 * 1000;

/** Public catalog endpoint — no API key required. Cached for an hour to avoid re-fetching on every admin page load. */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (openRouterModelsCache && Date.now() - openRouterModelsCache.fetchedAt < OPENROUTER_MODELS_TTL_MS) {
    return openRouterModelsCache.models;
  }
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) throw new Error(`OpenRouter ${response.status} lors de la récupération des modèles`);
  const data = (await response.json()) as { data?: { id: string; name?: string; context_length?: number }[] };
  const models: OpenRouterModel[] = (data.data ?? [])
    .map(m => ({
      id: m.id,
      name: m.name ?? m.id,
      description: m.context_length ? `${m.context_length.toLocaleString('fr-FR')} tokens de contexte` : '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  openRouterModelsCache = { models, fetchedAt: Date.now() };
  return models;
}

function callProvider(modelId: string, apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const provider = getProvider(modelId);
  if (provider === 'gemini') return callGemini(apiKey, modelId, promptText, images);
  if (provider === 'openrouter') return callOpenRouter(apiKey, modelId, promptText, images);
  return callClaude(apiKey, modelId, promptText, images);
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
      await callOpenRouter(apiKey, 'openai/gpt-4o-mini', 'Say "ok"', []);
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
  sessionId: number;
  exercisesAndAnswers: {
    exercise_id: number;
    type: ExerciseType;
    question: string;
    correct_answer: string;
    student_answer: string | null;
  }[];
}

/**
 * Generates exercises and returns the created llm_exchanges row id (session_id is
 * unknown yet — the session doesn't exist until after this succeeds), so the caller
 * can link the trace to the session once it's created.
 */
export async function generateExercises(
  input: GenerateExercisesInput,
): Promise<{ result: LlmGenerationResult; exchangeId: number }> {
  const { model, subject, level, topic, difficulty, numExercises, uploadedContent, images } = input;
  const apiKey = resolveApiKey(getProvider(model));
  const template = resolvePromptTemplate('generation');
  const curriculumContext = getTopicContext(level, subject, topic) ?? '';
  const promptText = renderTemplate(template, {
    subject, level, topic, difficulty,
    num_exercises: numExercises,
    uploaded_content: uploadedContent,
    curriculum_context: curriculumContext,
  });

  let raw: string;
  try {
    raw = await callProvider(model, apiKey, promptText, images);
  } catch (err) {
    exchangeRepo.create({
      sessionId: null, kind: 'generation', model,
      requestText: promptText, responseText: null, errorText: extractErrorMessage(err),
    });
    throw err;
  }

  let result: LlmGenerationResult;
  try {
    result = parseJsonResponse<LlmGenerationResult>(raw);
  } catch (err) {
    exchangeRepo.create({
      sessionId: null, kind: 'generation', model,
      requestText: promptText, responseText: raw,
      errorText: `Réponse JSON invalide : ${err instanceof Error ? err.message : String(err)}`,
    });
    throw err;
  }

  const exchangeId = exchangeRepo.create({
    sessionId: null, kind: 'generation', model,
    requestText: promptText, responseText: raw, errorText: null,
  });

  return { result, exchangeId };
}

export async function correctExercises(input: CorrectExercisesInput): Promise<LlmCorrectionResult> {
  const { model, subject, level, sessionId, exercisesAndAnswers } = input;
  const apiKey = resolveApiKey(getProvider(model));
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

  let raw: string;
  try {
    raw = await callProvider(model, apiKey, promptText, []);
  } catch (err) {
    exchangeRepo.create({
      sessionId, kind: 'correction', model,
      requestText: promptText, responseText: null, errorText: extractErrorMessage(err),
    });
    throw err;
  }

  let result: LlmCorrectionResult;
  try {
    result = parseJsonResponse<LlmCorrectionResult>(raw);
  } catch (err) {
    exchangeRepo.create({
      sessionId, kind: 'correction', model,
      requestText: promptText, responseText: raw,
      errorText: `Réponse JSON invalide : ${err instanceof Error ? err.message : String(err)}`,
    });
    throw err;
  }

  exchangeRepo.create({
    sessionId, kind: 'correction', model,
    requestText: promptText, responseText: raw, errorText: null,
  });

  return result;
}
