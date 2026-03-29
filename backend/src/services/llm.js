import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '../db/index.js';

function getApiKey(provider) {
  const row = getDb().prepare('SELECT api_key FROM api_keys WHERE provider = ?').get(provider);
  if (!row || !row.api_key) throw new Error(`Clé API ${provider} non configurée`);
  return row.api_key;
}

function getPrompt(name) {
  const row = getDb().prepare('SELECT content FROM prompts WHERE name = ?').get(name);
  if (!row) throw new Error(`Prompt "${name}" introuvable`);
  return row.content;
}

function renderPrompt(template, vars) {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val ?? '');
  }
  // Handle {{#if ...}} blocks
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key, block) => {
    return vars[key] ? block : '';
  });
  return result;
}

function parseJsonResponse(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned);
}

// ─── Claude ──────────────────────────────────────────────────────────────────

async function callClaude(promptText, imageBase64Array = []) {
  const apiKey = getApiKey('claude');
  const client = new Anthropic({ apiKey });

  const content = [];

  for (const img of imageBase64Array) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    });
  }

  content.push({ type: 'text', text: promptText });

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  });

  return message.content[0].text;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(promptText, imageBase64Array = []) {
  const apiKey = getApiKey('gemini');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const parts = [];

  for (const img of imageBase64Array) {
    parts.push({ inlineData: { mimeType: img.mediaType, data: img.data } });
  }

  parts.push({ text: promptText });

  const result = await model.generateContent(parts);
  return result.response.text();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateExercises({ model, subject, level, topic, difficulty, numExercises, uploadedContent, images }) {
  const template = getPrompt('generation');
  const promptText = renderPrompt(template, {
    subject,
    level,
    topic,
    difficulty,
    num_exercises: numExercises,
    uploaded_content: uploadedContent || '',
  });

  const raw = model === 'gemini'
    ? await callGemini(promptText, images || [])
    : await callClaude(promptText, images || []);

  return parseJsonResponse(raw);
}

export async function correctExercises({ model, subject, level, exercisesAndAnswers }) {
  const template = getPrompt('correction');

  const formatted = exercisesAndAnswers.map((ea, i) => `
Exercice ${i + 1} (id: ${ea.exercise_id}, type: ${ea.type}) :
Question : ${ea.question}
Réponse attendue : ${ea.correct_answer}
Réponse de l'élève : ${ea.student_answer ?? '(pas de réponse)'}
  `).join('\n---\n');

  const promptText = renderPrompt(template, {
    subject,
    level,
    exercises_and_answers: formatted,
  });

  const raw = model === 'gemini'
    ? await callGemini(promptText)
    : await callClaude(promptText);

  return parseJsonResponse(raw);
}
