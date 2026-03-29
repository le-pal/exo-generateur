import { getDb } from '../db/index.js';

export function findAll() {
  return getDb().prepare('SELECT * FROM prompts ORDER BY type, name').all();
}

export function findByName(name) {
  return getDb().prepare('SELECT * FROM prompts WHERE name = ?').get(name) ?? null;
}

export function update(name, { content, description }) {
  const db = getDb();
  const current = findByName(name);
  if (!current) return null;
  db.prepare("UPDATE prompts SET content = ?, description = ?, updated_at = datetime('now') WHERE name = ?")
    .run(content ?? current.content, description ?? current.description, name);
  return findByName(name);
}
