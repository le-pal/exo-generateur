import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findByKey } from '../repositories/settingsRepository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveLogDir(): string {
  const dbPath = process.env['DB_PATH'];
  if (dbPath) return path.dirname(dbPath);
  return path.join(__dirname, '../../../data');
}

function getLogFile(): string {
  return path.join(resolveLogDir(), 'llm_debug.log');
}

export interface LlmLogEntry {
  timestamp: string;
  provider: string;
  model: string;
  prompt: string;
  images_count: number;
  response?: string;
  error?: string;
  duration_ms: number;
}

export function isDebugEnabled(): boolean {
  return findByKey('debug_mode') === 'true';
}

export function writeLog(entry: LlmLogEntry): void {
  if (!isDebugEnabled()) return;
  try {
    const dir = resolveLogDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(getLogFile(), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // logging must not crash the app
  }
}

export function readLogs(maxLines = 200): LlmLogEntry[] {
  try {
    const file = getLogFile();
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    const lines: string[] = content.trim().split('\n').filter((l: string) => l.length > 0);
    return lines
      .slice(-maxLines)
      .map((l: string) => {
        try { return JSON.parse(l) as LlmLogEntry; } catch { return null; }
      })
      .filter((e: LlmLogEntry | null): e is LlmLogEntry => e !== null)
      .reverse();
  } catch {
    return [];
  }
}

export function clearLogs(): void {
  try {
    const file = getLogFile();
    if (fs.existsSync(file)) fs.writeFileSync(file, '', 'utf8');
  } catch {
    // silently fail
  }
}

export function getLogPath(): string {
  return getLogFile();
}
