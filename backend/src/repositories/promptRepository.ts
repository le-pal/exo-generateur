import { getDb } from '../db/index.js';
import type { Prompt } from '../types/index.js';

export function findAll(): Prompt[] {
  return getDb().prepare('SELECT * FROM prompts ORDER BY type, name').all() as Prompt[];
}

export function findByName(name: string): Prompt | null {
  return (getDb().prepare('SELECT * FROM prompts WHERE name = ?').get(name) as Prompt) ?? null;
}

export function update(name: string, { content, description }: { content?: string; description?: string }): Prompt | null {
  const current = findByName(name);
  if (!current) return null;
  getDb()
    .prepare("UPDATE prompts SET content = ?, description = ?, updated_at = datetime('now') WHERE name = ?")
    .run(content ?? current.content, description ?? current.description, name);
  return findByName(name);
}
