import { getDb } from '../db/index.js';
import type { ApiKeyRow } from '../types/index.js';

/** Returns all providers with a boolean is_set — never exposes the raw key. */
export function findAll(): ApiKeyRow[] {
  return getDb().prepare(`
    SELECT provider, active, updated_at,
      CASE WHEN api_key != '' THEN 1 ELSE 0 END AS is_set
    FROM api_keys
  `).all() as ApiKeyRow[];
}

/** Internal use only — returns the actual key for LLM calls. */
export function findKeyByProvider(provider: string): string | null {
  const row = getDb()
    .prepare('SELECT api_key FROM api_keys WHERE provider = ?')
    .get(provider) as { api_key: string } | undefined;
  return row?.api_key ?? null;
}

export function update(provider: string, { api_key, active }: { api_key?: string; active?: boolean }): void {
  const parts: string[] = ["updated_at = datetime('now')"];
  const params: unknown[] = [];
  if (api_key !== undefined) { parts.push('api_key = ?'); params.push(api_key); }
  if (active !== undefined) { parts.push('active = ?'); params.push(active ? 1 : 0); }
  params.push(provider);
  getDb().prepare(`UPDATE api_keys SET ${parts.join(', ')} WHERE provider = ?`).run(...params);
}
