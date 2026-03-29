import { Router } from 'express';
import multer from 'multer';
import { getDb } from '../db/index.js';
import { generateExercises, correctExercises } from '../services/llm.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// Get session with exercises and answers
router.get('/:id', (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session introuvable' });

  const exercises = db.prepare('SELECT * FROM exercises WHERE session_id = ? ORDER BY order_num').all(req.params.id);
  const exercisesWithAnswers = exercises.map(ex => {
    const answer = db.prepare('SELECT * FROM answers WHERE exercise_id = ?').get(ex.id);
    return {
      ...ex,
      options: ex.options ? JSON.parse(ex.options) : null,
      answer: answer || null,
    };
  });

  res.json({ ...session, exercises: exercisesWithAnswers });
});

// Create session + generate exercises
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { student_id, subject, topic, difficulty, num_exercises, model, uploaded_text } = req.body;

    if (!student_id || !subject || !topic) {
      return res.status(400).json({ error: 'student_id, subject et topic sont requis' });
    }

    const db = getDb();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    if (!student) return res.status(404).json({ error: 'Élève introuvable' });

    // Resolve model: body > admin setting
    const defaultModel = db.prepare("SELECT value FROM settings WHERE key = 'default_model'").get()?.value || 'claude';
    const selectedModel = model || defaultModel;

    // Prepare images for vision
    const images = (req.files || []).map(f => ({
      mediaType: f.mimetype,
      data: f.buffer.toString('base64'),
    }));

    // Generate exercises via LLM
    const result = await generateExercises({
      model: selectedModel,
      subject,
      level: student.level,
      topic,
      difficulty: difficulty || 'normal',
      numExercises: parseInt(num_exercises) || 5,
      uploadedContent: uploaded_text || '',
      images,
    });

    if (!result.exercises || !Array.isArray(result.exercises)) {
      return res.status(500).json({ error: 'Réponse LLM invalide' });
    }

    // Persist session
    const sessionResult = db.prepare(`
      INSERT INTO sessions (student_id, subject, topic, difficulty, num_exercises, model, status)
      VALUES (?, ?, ?, ?, ?, ?, 'in_progress')
    `).run(student_id, subject, topic, difficulty || 'normal', parseInt(num_exercises) || 5, selectedModel);

    const sessionId = sessionResult.lastInsertRowid;

    // Persist exercises
    const insertExercise = db.prepare(`
      INSERT INTO exercises (session_id, order_num, type, question, options, correct_answer, points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((exercises) => {
      exercises.forEach((ex, i) => {
        insertExercise.run(
          sessionId,
          i + 1,
          ex.type,
          ex.question,
          ex.options ? JSON.stringify(ex.options) : null,
          ex.correct_answer,
          ex.points || 1
        );
      });
    });
    insertMany(result.exercises);

    // Return full session
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    const exercises = db.prepare('SELECT * FROM exercises WHERE session_id = ? ORDER BY order_num').all(sessionId);

    res.status(201).json({
      ...session,
      exercises: exercises.map(ex => ({ ...ex, options: ex.options ? JSON.parse(ex.options) : null, answer: null })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Save answer for one exercise (auto-save)
router.put('/:sessionId/exercises/:exerciseId/answer', (req, res) => {
  const db = getDb();
  const { student_answer } = req.body;

  const exercise = db.prepare(
    'SELECT e.* FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE e.id = ? AND s.id = ?'
  ).get(req.params.exerciseId, req.params.sessionId);

  if (!exercise) return res.status(404).json({ error: 'Exercice introuvable' });

  const existing = db.prepare('SELECT id FROM answers WHERE exercise_id = ?').get(exercise.id);
  if (existing) {
    db.prepare("UPDATE answers SET student_answer = ?, submitted_at = datetime('now') WHERE exercise_id = ?")
      .run(student_answer ?? '', exercise.id);
  } else {
    db.prepare("INSERT INTO answers (exercise_id, student_answer, submitted_at) VALUES (?, ?, datetime('now'))")
      .run(exercise.id, student_answer ?? '');
  }

  // Update session updated_at
  db.prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(req.params.sessionId);

  res.json({ ok: true });
});

// Submit session for correction
router.post('/:id/correct', async (req, res) => {
  try {
    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(session.student_id);
    const exercises = db.prepare('SELECT * FROM exercises WHERE session_id = ? ORDER BY order_num').all(req.params.id);

    const exercisesAndAnswers = exercises.map(ex => {
      const answer = db.prepare('SELECT * FROM answers WHERE exercise_id = ?').get(ex.id);
      return {
        exercise_id: ex.id,
        type: ex.type,
        question: ex.question,
        correct_answer: ex.correct_answer,
        student_answer: answer?.student_answer ?? null,
      };
    });

    const result = await correctExercises({
      model: session.model,
      subject: session.subject,
      level: student.level,
      exercisesAndAnswers,
    });

    if (!result.corrections || !Array.isArray(result.corrections)) {
      return res.status(500).json({ error: 'Réponse de correction LLM invalide' });
    }

    // Persist corrections
    const updateAnswer = db.prepare(`
      UPDATE answers SET is_correct = ?, score = ?, correction = ? WHERE exercise_id = ?
    `);
    const insertAnswer = db.prepare(`
      INSERT INTO answers (exercise_id, is_correct, score, correction, submitted_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const applyCorrections = db.transaction((corrections) => {
      for (const c of corrections) {
        const existing = db.prepare('SELECT id FROM answers WHERE exercise_id = ?').get(c.exercise_id);
        if (existing) {
          updateAnswer.run(c.is_correct ? 1 : 0, c.score ?? (c.is_correct ? 1 : 0), c.explanation, c.exercise_id);
        } else {
          insertAnswer.run(c.exercise_id, c.is_correct ? 1 : 0, c.score ?? (c.is_correct ? 1 : 0), c.explanation);
        }
      }
    });
    applyCorrections(result.corrections);

    // Update session status
    db.prepare("UPDATE sessions SET status = 'corrected', updated_at = datetime('now') WHERE id = ?")
      .run(req.params.id);

    // Return full updated session
    const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    const updatedExercises = exercises.map(ex => {
      const answer = db.prepare('SELECT * FROM answers WHERE exercise_id = ?').get(ex.id);
      return {
        ...ex,
        options: ex.options ? JSON.parse(ex.options) : null,
        answer: answer || null,
      };
    });

    res.json({ ...updatedSession, exercises: updatedExercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mark session completed (without correction)
router.put('/:id/complete', (req, res) => {
  const db = getDb();
  db.prepare("UPDATE sessions SET status = 'completed', updated_at = datetime('now') WHERE id = ?")
    .run(req.params.id);
  res.json({ ok: true });
});

export default router;
