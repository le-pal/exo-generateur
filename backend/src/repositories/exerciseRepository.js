import { getDb } from '../db/index.js';

export function findBySessionId(sessionId) {
  return getDb()
    .prepare('SELECT * FROM exercises WHERE session_id = ? ORDER BY order_num')
    .all(sessionId);
}

export function findById(id) {
  return getDb().prepare('SELECT * FROM exercises WHERE id = ?').get(id) ?? null;
}

export function findByIdAndSessionId(id, sessionId) {
  return getDb().prepare(
    'SELECT e.* FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE e.id = ? AND s.id = ?'
  ).get(id, sessionId) ?? null;
}

/** Insert multiple exercises in a single transaction */
export function createMany(sessionId, exercises) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO exercises (session_id, order_num, type, question, options, correct_answer, points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  db.transaction(() => {
    exercises.forEach((ex, i) => {
      stmt.run(
        sessionId,
        i + 1,
        ex.type,
        ex.question,
        ex.options ? JSON.stringify(ex.options) : null,
        ex.correct_answer,
        ex.points ?? 1,
      );
    });
  })();
}
