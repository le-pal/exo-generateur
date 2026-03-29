import { Router } from 'express';
import { getDb } from '../db/index.js';
import { LEVELS, SUBJECTS, DIFFICULTIES } from '../data/subjects.js';

const router = Router();

// ── Settings ────────────────────────────────────────────────────────────────

router.get('/settings', (_req, res) => {
  const rows = getDb().prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

router.put('/settings', (req, res) => {
  const db = getDb();
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const updateAll = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run(key, String(value));
  });
  updateAll(Object.entries(req.body));
  res.json({ ok: true });
});

// ── API Keys ─────────────────────────────────────────────────────────────────

router.get('/api-keys', (_req, res) => {
  const keys = getDb().prepare('SELECT provider, active, updated_at, CASE WHEN api_key != \'\' THEN true ELSE false END as is_set FROM api_keys').all();
  res.json(keys);
});

router.put('/api-keys/:provider', (req, res) => {
  const { api_key, active } = req.body;
  const db = getDb();
  const row = db.prepare('SELECT id FROM api_keys WHERE provider = ?').get(req.params.provider);
  if (!row) return res.status(404).json({ error: 'Provider introuvable' });

  const updates = [];
  const params = [];
  if (api_key !== undefined) { updates.push('api_key = ?'); params.push(api_key); }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.provider);

  db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE provider = ?`).run(...params);
  res.json({ ok: true });
});

// ── Prompts ──────────────────────────────────────────────────────────────────

router.get('/prompts', (_req, res) => {
  const prompts = getDb().prepare('SELECT * FROM prompts ORDER BY type, name').all();
  res.json(prompts);
});

router.get('/prompts/:name', (req, res) => {
  const prompt = getDb().prepare('SELECT * FROM prompts WHERE name = ?').get(req.params.name);
  if (!prompt) return res.status(404).json({ error: 'Prompt introuvable' });
  res.json(prompt);
});

router.put('/prompts/:name', (req, res) => {
  const { content, description } = req.body;
  const db = getDb();
  const prompt = db.prepare('SELECT id FROM prompts WHERE name = ?').get(req.params.name);
  if (!prompt) return res.status(404).json({ error: 'Prompt introuvable' });

  db.prepare("UPDATE prompts SET content = ?, description = ?, updated_at = datetime('now') WHERE name = ?")
    .run(content ?? '', description ?? '', req.params.name);
  res.json({ ok: true });
});

// Reset prompt to default
router.post('/prompts/:name/reset', (req, res) => {
  // Re-seed by dropping and re-calling seed logic would be complex; instead store originals
  // For now, return 501 — user can manually reset from the UI hint
  res.status(501).json({ error: 'Réinitialisation non implémentée — copiez le prompt par défaut depuis la documentation' });
});

// ── Reference data ───────────────────────────────────────────────────────────

router.get('/reference', (_req, res) => {
  res.json({ levels: LEVELS, subjects: SUBJECTS, difficulties: DIFFICULTIES });
});

export default router;
