import { getDb } from '../db/index.js';
import type { Exercise, LlmExerciseItem } from '../types/index.js';
import { isLlmExerciseGroup } from '../types/index.js';

export type ExerciseRow = Exercise & { group_statement: string | null };

export function findBySessionId(sessionId: number): ExerciseRow[] {
  return getDb().prepare(`
    SELECT e.*, g.statement AS group_statement
    FROM exercises e
    LEFT JOIN exercise_groups g ON g.id = e.group_id
    WHERE e.session_id = ?
    ORDER BY e.order_num
  `).all(sessionId) as ExerciseRow[];
}

export function findById(id: number): Exercise | null {
  return (getDb().prepare('SELECT * FROM exercises WHERE id = ?').get(id) as Exercise) ?? null;
}

export function findByIdAndSessionId(id: number, sessionId: number): Exercise | null {
  return (getDb().prepare(
    'SELECT e.* FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE e.id = ? AND s.id = ?',
  ).get(id, sessionId) as Exercise) ?? null;
}

/** Inserts standalone exercises and exercise groups (with their sub-questions) in a single transaction. */
export function createMany(sessionId: number, items: LlmExerciseItem[]): void {
  const db = getDb();
  const groupStmt = db.prepare(`
    INSERT INTO exercise_groups (session_id, order_num, statement) VALUES (?, ?, ?)
  `);
  const exerciseStmt = db.prepare(`
    INSERT INTO exercises (session_id, group_id, order_num, type, question, options, correct_answer, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    let orderNum = 0;
    let groupOrderNum = 0;
    for (const item of items) {
      if (isLlmExerciseGroup(item)) {
        groupOrderNum += 1;
        const info = groupStmt.run(sessionId, groupOrderNum, item.statement);
        const groupId = Number(info.lastInsertRowid);
        for (const q of item.questions) {
          orderNum += 1;
          exerciseStmt.run(
            sessionId, groupId, orderNum, q.type, q.question,
            q.options ? JSON.stringify(q.options) : null, q.correct_answer, q.points ?? 1,
          );
        }
      } else {
        orderNum += 1;
        exerciseStmt.run(
          sessionId, null, orderNum, item.type, item.question,
          item.options ? JSON.stringify(item.options) : null, item.correct_answer, item.points ?? 1,
        );
      }
    }
  })();
}
