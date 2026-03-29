import { getDb } from '../db/index.js';
import type { Answer, LlmCorrection } from '../types/index.js';

export function findByExerciseId(exerciseId: number): Answer | null {
  return (getDb().prepare('SELECT * FROM answers WHERE exercise_id = ?').get(exerciseId) as Answer) ?? null;
}

export function upsert(exerciseId: number, studentAnswer: string): void {
  const db = getDb();
  const existing = findByExerciseId(exerciseId);
  if (existing) {
    db.prepare("UPDATE answers SET student_answer = ?, submitted_at = datetime('now') WHERE exercise_id = ?")
      .run(studentAnswer, exerciseId);
  } else {
    db.prepare("INSERT INTO answers (exercise_id, student_answer, submitted_at) VALUES (?, ?, datetime('now'))")
      .run(exerciseId, studentAnswer);
  }
}

/** Applies LLM correction results in a single transaction. */
export function bulkCorrect(corrections: LlmCorrection[]): void {
  const db = getDb();
  const updateStmt = db.prepare(
    'UPDATE answers SET is_correct = ?, score = ?, correction = ? WHERE exercise_id = ?',
  );
  const insertStmt = db.prepare(
    "INSERT INTO answers (exercise_id, is_correct, score, correction, submitted_at) VALUES (?, ?, ?, ?, datetime('now'))",
  );

  db.transaction(() => {
    for (const c of corrections) {
      const isCorrect = c.is_correct ? 1 : 0;
      const score = c.score ?? isCorrect;
      const existing = findByExerciseId(c.exercise_id);
      if (existing) {
        updateStmt.run(isCorrect, score, c.explanation, c.exercise_id);
      } else {
        insertStmt.run(c.exercise_id, isCorrect, score, c.explanation);
      }
    }
  })();
}
