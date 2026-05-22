import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { findKeyByProvider } from '../repositories/apiKeyRepository.js';
import { findByName } from '../repositories/promptRepository.js';
import { findByKey } from '../repositories/settingsRepository.js';
import { AppError } from '../types/index.js';
import { getProvider, stripOrPrefix, MODELS } from '../data/models.js';
import { writeLog, isDebugEnabled } from './logger.js';
import type {
  LlmProvider,
  Difficulty,
  ExerciseType,
  ImagePayload,
  LlmGenerationResult,
  LlmCorrectionResult,
} from '../types/index.js';
import type { ModelDefinition } from '../data/models.js';

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

  // Anthropic SDK: { error: { error: { message } } }
  const nested = (e['error'] as Record<string, unknown> | undefined);
  if (nested) {
    const inner = (nested['error'] as Record<string, unknown> | undefined);
    if (typeof inner?.['message'] === 'string') return inner['message'];
    if (typeof nested['message'] === 'string') return nested['message'];
  }

  // Gemini SDK / fetch errors: { message }
  if (typeof e['message'] === 'string') {
    return e['message'].replace(/^\d{3} /, '');
  }

  return 'Erreur inconnue';
}

function getOpenRouterBaseUrl(): string {
  return (findByKey('openrouter_base_url') ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '');
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

async function callOpenRouter(apiKey: string, baseUrl: string, modelId: string, promptText: string, images: ImagePayload[]): Promise<string> {
  type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
  type Message = { role: string; content: string | ContentPart[] };

  const messages: Message[] = [];

  if (images.length > 0) {
    const parts: ContentPart[] = [
      ...images.map(img => ({
        type: 'image_url' as const,
        image_url: { url: `data:${img.mediaType};base64,${img.data}` },
      })),
      { type: 'text' as const, text: promptText },
    ];
    messages.push({ role: 'user', content: parts });
  } else {
    messages.push({ role: 'user', content: promptText });
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://exo-generateur',
      'X-Title': 'Exo Générateur',
    },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 4096 }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(extractErrorMessage(errBody));
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Réponse vide du modèle');
  return content;
}

// ── Debug wrapper ─────────────────────────────────────────────────────────────

async function callWithDebug(
  provider: LlmProvider,
  modelId: string,
  promptText: string,
  images: ImagePayload[],
  fn: () => Promise<string>,
): Promise<string> {
  if (!isDebugEnabled()) return fn();

  const start = Date.now();
  try {
    const response = await fn();
    writeLog({
      timestamp: new Date().toISOString(),
      provider,
      model: modelId,
      prompt: promptText,
      images_count: images.length,
      response,
      duration_ms: Date.now() - start,
    });
    return response;
  } catch (err) {
    writeLog({
      timestamp: new Date().toISOString(),
      provider,
      model: modelId,
      prompt: promptText,
      images_count: images.length,
      error: extractErrorMessage(err),
      duration_ms: Date.now() - start,
    });
    throw err;
  }
}

async function callProvider(modelId: string, apiKey: string, promptText: string, images: ImagePayload[]): Promise<string> {
  const provider = getProvider(modelId);
  const actualModelId = stripOrPrefix(modelId);

  return callWithDebug(provider, actualModelId, promptText, images, () => {
    if (provider === 'gemini') return callGemini(apiKey, actualModelId, promptText, images);
    if (provider === 'openrouter') return callOpenRouter(apiKey, getOpenRouterBaseUrl(), actualModelId, promptText, images);
    return callClaude(apiKey, actualModelId, promptText, images);
  });
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
      // OpenRouter: just list models as connectivity test
      const baseUrl = getOpenRouterBaseUrl();
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { ok: false, error: extractErrorMessage(errBody) };
      }
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err) };
  }
}

// ── Model listing (OpenRouter / OpenAI-compatible) ────────────────────────────

export async function listRemoteModels(provider: LlmProvider, apiKey: string): Promise<ModelDefinition[]> {
  if (provider !== 'openrouter') {
    return MODELS.filter(m => m.provider === provider);
  }

  const baseUrl = getOpenRouterBaseUrl();
  const response = await fetch(`${baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new AppError(extractErrorMessage(errBody), 502);
  }

  const data = await response.json() as {
    data: Array<{ id: string; name?: string; description?: string; context_length?: number }>;
  };

  return data.data.map(m => ({
    id: `or:${m.id}`,
    label: m.name ?? m.id,
    provider: 'openrouter' as LlmProvider,
    description: m.description
      ? m.description.slice(0, 120)
      : m.context_length
        ? `Contexte : ${m.context_length.toLocaleString()} tokens`
        : '',
  }));
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
  const apiKey = resolveApiKey(getProvider(model));
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
  const raw = await callProvider(model, apiKey, promptText, []);
  return parseJsonResponse<LlmCorrectionResult>(raw);
}
