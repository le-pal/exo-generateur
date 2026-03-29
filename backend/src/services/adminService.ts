import * as settingsRepo from '../repositories/settingsRepository.js';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import { testProvider } from './llm.js';
import { LEVELS, SUBJECTS, DIFFICULTIES } from '../data/subjects.js';
import { AppError } from '../types/index.js';
import type { ApiKeyRow, Prompt, LlmModel } from '../types/index.js';
import type { Level, Subject, DifficultyOption } from '../data/subjects.js';

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): Record<string, string> {
  return settingsRepo.findAll();
}

export function updateSettings(data: Record<string, string>): void {
  settingsRepo.upsertMany(Object.entries(data));
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export function getApiKeys(): ApiKeyRow[] {
  return apiKeyRepo.findAll();
}

export function updateApiKey(provider: string, data: { api_key?: string; active?: boolean }): void {
  const rows = apiKeyRepo.findAll();
  if (!rows.find(r => r.provider === provider)) throw new AppError('Provider introuvable', 404);
  apiKeyRepo.update(provider, data);
}

export async function testApiKey(provider: string) {
  const key = apiKeyRepo.findKeyByProvider(provider);
  if (!key) return { ok: false, error: 'Aucune clé configurée pour ce provider' };
  return testProvider(provider as LlmModel, key);
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export function getPrompts(): Prompt[] {
  return promptRepo.findAll();
}

export function getPrompt(name: string): Prompt {
  const prompt = promptRepo.findByName(name);
  if (!prompt) throw new AppError('Prompt introuvable', 404);
  return prompt;
}

export function updatePrompt(name: string, data: { content?: string; description?: string }): Prompt {
  if (!promptRepo.findByName(name)) throw new AppError('Prompt introuvable', 404);
  return promptRepo.update(name, data)!;
}

// ── Reference data ────────────────────────────────────────────────────────────

export function getReferenceData(): { levels: Level[]; subjects: Subject[]; difficulties: DifficultyOption[] } {
  return { levels: LEVELS, subjects: SUBJECTS, difficulties: DIFFICULTIES };
}
