import * as settingsRepo from '../repositories/settingsRepository.js';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import { LEVELS, SUBJECTS, DIFFICULTIES } from '../data/subjects.js';

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings() {
  return settingsRepo.findAll();
}

export function updateSettings(data) {
  settingsRepo.upsertMany(Object.entries(data));
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export function getApiKeys() {
  return apiKeyRepo.findAll();
}

export function updateApiKey(provider, { api_key, active }) {
  const rows = apiKeyRepo.findAll();
  if (!rows.find(r => r.provider === provider)) {
    throw Object.assign(new Error('Provider introuvable'), { status: 404 });
  }
  apiKeyRepo.update(provider, { api_key, active });
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export function getPrompts() {
  return promptRepo.findAll();
}

export function getPrompt(name) {
  const prompt = promptRepo.findByName(name);
  if (!prompt) throw Object.assign(new Error('Prompt introuvable'), { status: 404 });
  return prompt;
}

export function updatePrompt(name, { content, description }) {
  const prompt = promptRepo.findByName(name);
  if (!prompt) throw Object.assign(new Error('Prompt introuvable'), { status: 404 });
  return promptRepo.update(name, { content, description });
}

// ── Reference data ────────────────────────────────────────────────────────────

export function getReferenceData() {
  return { levels: LEVELS, subjects: SUBJECTS, difficulties: DIFFICULTIES };
}
