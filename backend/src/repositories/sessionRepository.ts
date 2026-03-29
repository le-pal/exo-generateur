import { getDb } from '../db/index.js';
import type { Session, SessionStatus, LlmModel, Difficulty } from '../types/index.js';

interface CreateSessionInput {
  student_id: number;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  num_exercises: number;
  model: LlmModel;
}

export function findById(id: number): Session | null {
  return (getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session) ?? null;
}

export function create(input: CreateSessionInput): Session {
  const result = getDb().prepare(`
    INSERT INTO sessions (student_id, subject, topic, difficulty, num_exercises, model, status)
    VALUES (?, ?, ?, ?, ?, ?, 'in_progress')
  `).run(input.student_id, input.subject, input.topic, input.difficulty, input.num_exercises, input.model);
  return findById(result.lastInsertRowid as number)!;
}

export function updateStatus(id: number, status: SessionStatus): void {
  getDb()
    .prepare("UPDATE sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);
}

export function touch(id: number): void {
  getDb().prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(id);
}
