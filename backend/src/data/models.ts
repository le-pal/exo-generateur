export type LlmProvider = 'claude' | 'gemini' | 'openrouter';

export interface ModelDefinition {
  id: string;
  label: string;
  provider: LlmProvider;
  description: string;
}

export const STATIC_MODELS: ModelDefinition[] = [
  // ── Claude ────────────────────────────────────────────────────────────────
  { id: 'claude-opus-4-6',          label: 'Claude Opus 4.6',    provider: 'claude', description: 'Le plus puissant' },
  { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6',  provider: 'claude', description: 'Équilibré — recommandé' },
  { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5',   provider: 'claude', description: 'Rapide et économique' },
  // ── Gemini ────────────────────────────────────────────────────────────────
  { id: 'gemini-2.0-flash',         label: 'Gemini 2.0 Flash',   provider: 'gemini', description: 'Rapide — recommandé' },
  { id: 'gemini-1.5-pro',           label: 'Gemini 1.5 Pro',     provider: 'gemini', description: 'Très capable' },
  { id: 'gemini-1.5-flash',         label: 'Gemini 1.5 Flash',   provider: 'gemini', description: 'Rapide et léger' },
];

// Cache of dynamically fetched OpenRouter model definitions
let openrouterModels: ModelDefinition[] = [];
const openrouterModelIds = new Set<string>();

export function setOpenrouterModels(models: ModelDefinition[]): void {
  openrouterModels = models;
  openrouterModelIds.clear();
  for (const m of models) openrouterModelIds.add(m.id);
}

export function getOpenrouterModels(): ModelDefinition[] {
  return openrouterModels;
}

/** Returns all available models (static + cached OpenRouter ones). */
export function getAllModels(): ModelDefinition[] {
  return [...STATIC_MODELS, ...openrouterModels];
}

// Keep MODELS alias for backward compat
export const MODELS = STATIC_MODELS;

export function getProvider(modelId: string): LlmProvider {
  if (openrouterModelIds.has(modelId)) return 'openrouter';
  const def = STATIC_MODELS.find(m => m.id === modelId);
  if (def) return def.provider;
  if (modelId.startsWith('claude')) return 'claude';
  if (modelId.startsWith('gemini')) return 'gemini';
  // OpenRouter model IDs typically contain '/' (e.g. anthropic/claude-3.5-sonnet)
  if (modelId.includes('/')) return 'openrouter';
  throw new Error(`Modèle inconnu : ${modelId}`);
}
