import { getDb } from '../db/index.js';

export function findAll() {
  return getDb().prepare('SELECT * FROM students ORDER BY name').all();
}

export function findById(id) {
  return getDb().prepare('SELECT * FROM students WHERE id = ?').get(id) ?? null;
}

export function create({ name, level }) {
  const result = getDb()
    .prepare('INSERT INTO students (name, level) VALUES (?, ?)')
    .run(name, level);
  return findById(result.lastInsertRowid);
}

export function update(id, { name, level }) {
  const db = getDb();
  const current = findById(id);
  if (!current) return null;
  db.prepare("UPDATE students SET name = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name ?? current.name, level ?? current.level, id);
  return findById(id);
}

export function remove(id) {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
}

export function findSessionsByStudentId(studentId) {
  return getDb().prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM exercises e WHERE e.session_id = s.id) AS exercise_count,
      (SELECT COUNT(*) FROM exercises e
       JOIN answers a ON a.exercise_id = e.id
       WHERE e.session_id = s.id AND a.is_correct = 1) AS correct_count
    FROM sessions s
    WHERE s.student_id = ?
    ORDER BY s.created_at DESC
  `).all(studentId);
}
