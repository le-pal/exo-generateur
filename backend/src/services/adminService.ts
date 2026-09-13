import * as settingsRepo from '../repositories/settingsRepository.js';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import * as exchangeRepo from '../repositories/exchangeRepository.js';
import { testProvider, fetchOpenRouterModels } from './llm.js';
import { LEVELS, SUBJECTS, DIFFICULTIES } from '../data/subjects.js';
import { MODELS } from '../data/models.js';
import type { ModelDefinition } from '../data/models.js';
import { CURRICULUM } from '../data/curriculum.js';
import { AppError } from '../types/index.js';
import type { ApiKeyRow, Prompt, LlmProvider, LlmExchangeRow } from '../types/index.js';
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
  return testProvider(provider as LlmProvider, key);
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

// ── LLM exchange errors ──────────────────────────────────────────────────────

export function getErrorExchanges(): LlmExchangeRow[] {
  return exchangeRepo.findErrors();
}

// ── Reference data ────────────────────────────────────────────────────────────

export async function getReferenceData() {
  const activeProviders = new Set(
    apiKeyRepo.findAll().filter(k => k.active === 1 && k.is_set === 1).map(k => k.provider),
  );
  const models: ModelDefinition[] = MODELS.filter(m => activeProviders.has(m.provider));

  if (activeProviders.has('openrouter')) {
    try {
      const openRouterModels = await fetchOpenRouterModels();
      models.push(
        ...openRouterModels.map(m => ({
          id: m.id, label: m.name, provider: 'openrouter' as const, description: m.description,
        })),
      );
    } catch {
      // Catalogue OpenRouter indisponible — on garde les modèles Claude/Gemini déjà résolus.
    }
  }

  return { levels: LEVELS, subjects: SUBJECTS, difficulties: DIFFICULTIES, models, curriculum: CURRICULUM };
}
