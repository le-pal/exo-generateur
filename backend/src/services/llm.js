import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { findKeyByProvider } from '../repositories/apiKeyRepository.js';
import { findByName } from '../repositories/promptRepository.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveApiKey(provider) {
  const key = findKeyByProvider(provider);
  if (!key) throw Object.assign(new Error(`Clé API ${provider} non configurée`), { status: 503 });
  return key;
}

function resolvePromptTemplate(name) {
  const prompt = findByName(name);
  if (!prompt) throw Object.assign(new Error(`Prompt "${name}" introuvable`), { status: 500 });
  return prompt.content;
}

function renderTemplate(template, vars) {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val ?? '');
  }
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key, block) =>
    vars[key] ? block : ''
  );
  return result;
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned);
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function callClaude(apiKey, promptText, images = []) {
  const client = new Anthropic({ apiKey });
  const content = [
    ...images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    })),
    { type: 'text', text: promptText },
  ];
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  });
  return message.content[0].text;
}

async function callGemini(apiKey, promptText, images = []) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const parts = [
    ...images.map(img => ({ inlineData: { mimeType: img.mediaType, data: img.data } })),
    { text: promptText },
  ];
  const result = await model.generateContent(parts);
  return result.response.text();
}

function callProvider(provider, apiKey, promptText, images) {
  return provider === 'gemini'
    ? callGemini(apiKey, promptText, images)
    : callClaude(apiKey, promptText, images);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateExercises({ model, subject, level, topic, difficulty, numExercises, uploadedContent, images }) {
  const apiKey = resolveApiKey(model);
  const template = resolvePromptTemplate('generation');
  const promptText = renderTemplate(template, {
    subject, level, topic, difficulty,
    num_exercises: numExercises,
    uploaded_content: uploadedContent || '',
  });
  const raw = await callProvider(model, apiKey, promptText, images);
  return parseJsonResponse(raw);
}

export async function correctExercises({ model, subject, level, exercisesAndAnswers }) {
  const apiKey = resolveApiKey(model);
  const template = resolvePromptTemplate('correction');
  const formatted = exercisesAndAnswers
    .map((ea, i) => `Exercice ${i + 1} (id: ${ea.exercise_id}, type: ${ea.type}) :
Question : ${ea.question}
Réponse attendue : ${ea.correct_answer}
Réponse de l'élève : ${ea.student_answer ?? '(pas de réponse)'}`)
    .join('\n---\n');
  const promptText = renderTemplate(template, { subject, level, exercises_and_answers: formatted });
  const raw = await callProvider(model, apiKey, promptText, []);
  return parseJsonResponse(raw);
}
