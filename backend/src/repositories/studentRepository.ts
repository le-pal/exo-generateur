import { getDb } from '../db/index.js';
import type { Student, StudentSessionSummary } from '../types/index.js';

export function findAll(): Student[] {
  return getDb().prepare('SELECT * FROM students ORDER BY name').all() as Student[];
}

export function findById(id: number): Student | null {
  return (getDb().prepare('SELECT * FROM students WHERE id = ?').get(id) as Student) ?? null;
}

export function create({ name, level }: { name: string; level: string }): Student {
  const result = getDb()
    .prepare('INSERT INTO students (name, level) VALUES (?, ?)')
    .run(name, level);
  return findById(result.lastInsertRowid as number)!;
}

export function update(id: number, { name, level }: { name?: string; level?: string }): Student | null {
  const current = findById(id);
  if (!current) return null;
  getDb()
    .prepare("UPDATE students SET name = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name ?? current.name, level ?? current.level, id);
  return findById(id);
}

export function remove(id: number): void {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
}

export function findSessionsByStudentId(studentId: number): StudentSessionSummary[] {
  return getDb().prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM exercises e WHERE e.session_id = s.id) AS exercise_count,
      (SELECT COUNT(*) FROM exercises e
       JOIN answers a ON a.exercise_id = e.id
       WHERE e.session_id = s.id AND a.is_correct = 1) AS correct_count
    FROM sessions s
    WHERE s.student_id = ?
    ORDER BY s.created_at DESC
  `).all(studentId) as StudentSessionSummary[];
}
