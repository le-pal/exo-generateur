import { getDb } from '../db/index.js';
import type { LlmExchangeKind, LlmExchangeRow } from '../types/index.js';

export function create(data: {
  sessionId: number | null;
  kind: LlmExchangeKind;
  model: string;
  requestText: string;
  responseText: string | null;
  errorText: string | null;
}): number {
  const info = getDb().prepare(`
    INSERT INTO llm_exchanges (session_id, kind, model, request_text, response_text, error_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.sessionId, data.kind, data.model, data.requestText, data.responseText, data.errorText);
  return Number(info.lastInsertRowid);
}

export function attachSession(exchangeId: number, sessionId: number): void {
  getDb().prepare('UPDATE llm_exchanges SET session_id = ? WHERE id = ?').run(sessionId, exchangeId);
}

export function findBySessionId(sessionId: number): LlmExchangeRow[] {
  return getDb()
    .prepare('SELECT * FROM llm_exchanges WHERE session_id = ? ORDER BY id ASC')
    .all(sessionId) as LlmExchangeRow[];
}

/** All failed exchanges, most recent first — includes ones with no session_id (generation failed before the session could be created). */
export function findErrors(): LlmExchangeRow[] {
  return getDb()
    .prepare('SELECT * FROM llm_exchanges WHERE error_text IS NOT NULL ORDER BY id DESC')
    .all() as LlmExchangeRow[];
}
