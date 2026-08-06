import type { ModelDefinition } from '../data/models.js';
import { setOpenrouterModels } from '../data/models.js';
import { AppError } from '../types/index.js';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

interface OpenRouterModelRaw {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt: string; completion: string };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModelRaw[];
}

export async function fetchOpenRouterModels(apiKey: string): Promise<ModelDefinition[]> {
  const res = await fetch(`${OPENROUTER_API_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://exo-generateur.scheffer.top',
      'X-Title': 'Exo Generateur',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AppError(`OpenRouter models fetch failed (${res.status}): ${body.slice(0, 200)}`, 502);
  }

  const json = await res.json() as OpenRouterModelsResponse;
  const models: ModelDefinition[] = json.data.map(m => ({
    id: m.id,
    label: m.name ?? m.id,
    provider: 'openrouter' as const,
    description: buildDescription(m),
  }));

  setOpenrouterModels(models);
  return models;
}

function buildDescription(m: OpenRouterModelRaw): string {
  const parts: string[] = [];
  if (m.context_length) parts.push(`${Math.round(m.context_length / 1000)}k ctx`);
  if (m.pricing?.prompt) {
    const price = parseFloat(m.pricing.prompt) * 1_000_000;
    if (price > 0) parts.push(`$${price.toFixed(2)}/Mtok`);
    else parts.push('gratuit');
  }
  return parts.join(' · ') || 'OpenRouter';
}

export async function testOpenRouterKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${OPENROUTER_API_BASE}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://exo-generateur.scheffer.top',
        'X-Title': 'Exo Generateur',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
