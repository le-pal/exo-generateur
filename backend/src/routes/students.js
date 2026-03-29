import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

// List all students
router.get('/', (_req, res) => {
  const students = getDb().prepare('SELECT * FROM students ORDER BY name').all();
  res.json(students);
});

// Get one student
router.get('/:id', (req, res) => {
  const student = getDb().prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Élève introuvable' });
  res.json(student);
});

// Create student
router.post('/', (req, res) => {
  const { name, level } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Le nom est requis' });
  const result = getDb()
    .prepare("INSERT INTO students (name, level) VALUES (?, ?)")
    .run(name.trim(), level || '6ème');
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), level: level || '6ème' });
});

// Update student
router.put('/:id', (req, res) => {
  const { name, level } = req.body;
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Élève introuvable' });
  db.prepare("UPDATE students SET name = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name ?? student.name, level ?? student.level, req.params.id);
  res.json({ ...student, name: name ?? student.name, level: level ?? student.level });
});

// Delete student
router.delete('/:id', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Élève introuvable' });
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Student history (sessions)
router.get('/:id/sessions', (req, res) => {
  const sessions = getDb().prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM exercises e WHERE e.session_id = s.id) as exercise_count,
      (SELECT COUNT(*) FROM exercises e
       JOIN answers a ON a.exercise_id = e.id
       WHERE e.session_id = s.id AND a.is_correct = 1) as correct_count
    FROM sessions s
    WHERE s.student_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);
  res.json(sessions);
});

export default router;
