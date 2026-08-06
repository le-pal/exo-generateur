import fs from 'fs';
import path from 'path';
import { getDb } from '../db/index.js';

const LOG_DIR = process.env['LOG_DIR'] ?? path.join(process.cwd(), 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'llm-exchanges.jsonl');
const MAX_LOG_LINES = 500;

export interface LlmLogEntry {
  timestamp: string;
  operation: 'generation' | 'correction' | 'test';
  provider: string;
  model: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  prompt?: string;
  response?: string;
  prompt_length: number;
  response_length: number;
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function isDebugMode(): boolean {
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('debug_mode') as { value: string } | undefined;
    return row?.value === 'true';
  } catch {
    return false;
  }
}

export function writeLog(entry: LlmLogEntry): void {
  try {
    ensureLogDir();
    const debug = isDebugMode();
    const toWrite: LlmLogEntry = debug
      ? entry
      : { ...entry, prompt: undefined, response: undefined };
    fs.appendFileSync(LOG_FILE, JSON.stringify(toWrite) + '\n', 'utf8');
    trimLogFile();
  } catch (err) {
    console.error('[logger] Failed to write log:', err);
  }
}

function trimLogFile(): void {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter((l: string) => l.trim() !== '');
    if (lines.length > MAX_LOG_LINES) {
      const trimmed = lines.slice(lines.length - MAX_LOG_LINES);
      fs.writeFileSync(LOG_FILE, trimmed.join('\n') + '\n', 'utf8');
    }
  } catch {
    // best effort
  }
}

export function readLogs(limit = 100): LlmLogEntry[] {
  try {
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter((l: string) => l.trim() !== '');
    return lines
      .slice(-limit)
      .reverse()
      .map((l: string) => {
        try { return JSON.parse(l) as LlmLogEntry; } catch { return null; }
      })
      .filter(Boolean) as LlmLogEntry[];
  } catch {
    return [];
  }
}
