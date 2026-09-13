export type LlmProvider = 'claude' | 'gemini' | 'openrouter';

export interface ModelDefinition {
  id: string;
  label: string;
  provider: LlmProvider;
  description: string;
}

export const MODELS: ModelDefinition[] = [
  // ── Claude ────────────────────────────────────────────────────────────────
  { id: 'claude-opus-4-6',          label: 'Claude Opus 4.6',    provider: 'claude', description: 'Le plus puissant' },
  { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6',  provider: 'claude', description: 'Équilibré — recommandé' },
  { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5',   provider: 'claude', description: 'Rapide et économique' },
  // ── Gemini ────────────────────────────────────────────────────────────────
  { id: 'gemini-2.0-flash',         label: 'Gemini 2.0 Flash',   provider: 'gemini', description: 'Rapide — recommandé' },
  { id: 'gemini-1.5-pro',           label: 'Gemini 1.5 Pro',     provider: 'gemini', description: 'Très capable' },
  { id: 'gemini-1.5-flash',         label: 'Gemini 1.5 Flash',   provider: 'gemini', description: 'Rapide et léger' },
  // ── OpenRouter : catalogue chargé dynamiquement, voir llm.ts#fetchOpenRouterModels ──
];

export function getProvider(modelId: string): LlmProvider {
  const def = MODELS.find(m => m.id === modelId);
  if (def) return def.provider;
  if (modelId.startsWith('claude')) return 'claude';
  if (modelId.startsWith('gemini')) return 'gemini';
  // OpenRouter model ids are always namespaced "vendor/model", e.g. "openai/gpt-4o".
  if (modelId.includes('/')) return 'openrouter';
  throw new Error(`Modèle inconnu : ${modelId}`);
}
