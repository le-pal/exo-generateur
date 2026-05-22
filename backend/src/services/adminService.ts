import * as settingsRepo from '../repositories/settingsRepository.js';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import { testProvider, listRemoteModels } from './llm.js';
import { readLogs, clearLogs, getLogPath } from './logger.js';
import { LEVELS, SUBJECTS, DIFFICULTIES } from '../data/subjects.js';
import { MODELS } from '../data/models.js';
import { AppError } from '../types/index.js';
import type { ApiKeyRow, Prompt, LlmProvider } from '../types/index.js';
import type { Level, Subject, DifficultyOption } from '../data/subjects.js';
import type { ModelDefinition } from '../data/models.js';

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

export async function getProviderModels(provider: string): Promise<ModelDefinition[]> {
  const key = apiKeyRepo.findKeyByProvider(provider);
  if (!key) throw new AppError('Aucune clé configurée pour ce provider', 400);
  return listRemoteModels(provider as LlmProvider, key);
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

export function getReferenceData() {
  const allKeys = apiKeyRepo.findAll();
  const activeProviders = new Set(
    allKeys.filter(k => k.active === 1 && k.is_set === 1).map(k => k.provider),
  );

  // Static models for claude and gemini
  const staticModels = MODELS.filter(m => activeProviders.has(m.provider));

  // If the current default_model is an OpenRouter model, include it so the UI shows it as selected
  const defaultModel = settingsRepo.findByKey('default_model') ?? '';
  const openrouterModels: ModelDefinition[] = [];
  if (defaultModel.startsWith('or:') && activeProviders.has('openrouter')) {
    const cached = settingsRepo.findByKey('openrouter_selected_model_meta');
    if (cached) {
      try {
        openrouterModels.push(JSON.parse(cached) as ModelDefinition);
      } catch {
        openrouterModels.push({
          id: defaultModel,
          label: defaultModel.slice(3),
          provider: 'openrouter',
          description: 'Modèle OpenRouter sélectionné',
        });
      }
    }
  }

  return {
    levels: LEVELS as Level[],
    subjects: SUBJECTS as Subject[],
    difficulties: DIFFICULTIES as DifficultyOption[],
    models: [...staticModels, ...openrouterModels],
  };
}

// ── Debug logs ────────────────────────────────────────────────────────────────

export function getDebugLogs(limit?: number) {
  return {
    logs: readLogs(limit ?? 200),
    logFile: getLogPath(),
  };
}

export function clearDebugLogs() {
  clearLogs();
  return { ok: true };
}
