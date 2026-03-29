import { getDb } from '../db/index.js';

/** Returns all settings as a plain { key: value } object. */
export function findAll() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export function findByKey(key) {
  return getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value ?? null;
}

/** Upsert multiple key-value pairs in a single transaction. */
export function upsertMany(entries) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  db.transaction(() => {
    for (const [key, value] of entries) stmt.run(key, String(value));
  })();
}
