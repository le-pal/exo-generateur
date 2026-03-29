import { getDb } from '../db/index.js';

export function findById(id) {
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) ?? null;
}

export function create({ student_id, subject, topic, difficulty, num_exercises, model }) {
  const result = getDb().prepare(`
    INSERT INTO sessions (student_id, subject, topic, difficulty, num_exercises, model, status)
    VALUES (?, ?, ?, ?, ?, ?, 'in_progress')
  `).run(student_id, subject, topic, difficulty, num_exercises, model);
  return findById(result.lastInsertRowid);
}

export function updateStatus(id, status) {
  getDb().prepare("UPDATE sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);
}

export function touch(id) {
  getDb().prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(id);
}
