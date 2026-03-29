import { getDb } from '../db/index.js';

/** Returns all providers with a boolean is_set — never exposes the raw key. */
export function findAll() {
  return getDb().prepare(`
    SELECT provider, active, updated_at,
      CASE WHEN api_key != '' THEN 1 ELSE 0 END AS is_set
    FROM api_keys
  `).all();
}

/** Internal use only — returns the actual key for LLM calls. */
export function findKeyByProvider(provider) {
  const row = getDb().prepare('SELECT api_key FROM api_keys WHERE provider = ?').get(provider);
  return row?.api_key ?? null;
}

export function update(provider, { api_key, active }) {
  const db = getDb();
  const updates = ["updated_at = datetime('now')"];
  const params = [];
  if (api_key !== undefined) { updates.push('api_key = ?'); params.push(api_key); }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  params.push(provider);
  db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE provider = ?`).run(...params);
}
