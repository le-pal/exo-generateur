import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env['DB_PATH'] ?? path.join(__dirname, '../../../data/exo.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function initDb(): void {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createSchema(db);
  seedDefaultData(db);
  console.log(`SQLite connected: ${DB_PATH}`);
}

function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT '6ème',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'normal',
      num_exercises INTEGER NOT NULL DEFAULT 5,
      model TEXT NOT NULL DEFAULT 'claude',
      status TEXT NOT NULL DEFAULT 'in_progress',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      order_num INTEGER NOT NULL,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      student_answer TEXT,
      is_correct INTEGER,
      score REAL,
      correction TEXT,
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL UNIQUE,
      api_key TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seedDefaultData(db: Database.Database): void {
  const modelSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('default_model');
  if (!modelSetting) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('default_model', 'claude-sonnet-4-6')").run();
  }

  const genPrompt = db.prepare('SELECT id FROM prompts WHERE name = ?').get('generation');
  if (!genPrompt) {
    db.prepare('INSERT INTO prompts (name, type, content, description) VALUES (?, ?, ?, ?)').run(
      'generation',
      'generation',
      `Tu es un professeur expert en {{subject}} pour des élèves de niveau {{level}}.

Génère exactement {{num_exercises}} exercices de difficulté {{difficulty}} sur le thème : "{{topic}}".

{{#if uploaded_content}}
Voici du contenu de référence (cours ou exercices) fourni par l'enseignant :
{{uploaded_content}}
{{/if}}

INSTRUCTIONS :
- Adapte le vocabulaire et la complexité au niveau {{level}}
- Varie les types de questions pour maintenir l'engagement
- Choisis le type le plus adapté à chaque question :
  * "mcq" : question à choix multiple (4 options), idéal pour connaissances et compréhension
  * "text" : réponse rédigée libre, pour l'analyse et l'expression
  * "number" : résultat numérique uniquement, pour les calculs
  * "fill_blank" : compléter une phrase avec [BLANK], pour vocabulaire et grammaire

Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication :
{
  "exercises": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": "option A",
      "points": 1
    },
    {
      "type": "text",
      "question": "...",
      "options": null,
      "correct_answer": "Réponse attendue détaillée...",
      "points": 2
    }
  ]
}`,
      'Prompt de génération des exercices',
    );
  }

  const corrPrompt = db.prepare('SELECT id FROM prompts WHERE name = ?').get('correction');
  if (!corrPrompt) {
    db.prepare('INSERT INTO prompts (name, type, content, description) VALUES (?, ?, ?, ?)').run(
      'correction',
      'correction',
      `Tu es un professeur bienveillant qui corrige des exercices de {{subject}} pour un élève de niveau {{level}}.

Pour chaque exercice ci-dessous, évalue la réponse de l'élève.

Exercices et réponses :
{{exercises_and_answers}}

Réponds UNIQUEMENT avec du JSON valide, sans markdown :
{
  "corrections": [
    {
      "exercise_id": 1,
      "is_correct": true,
      "score": 1.0,
      "explanation": "Bravo ! Tu as bien compris..."
    }
  ]
}

RÈGLES :
- score entre 0 et 1 (peut être partiel pour les questions ouvertes)
- Sois encourageant et pédagogique, jamais décourageant
- Pour les questions ouvertes (text), accepte les réponses correctes même si le wording diffère
- Explique toujours POURQUOI la réponse est correcte ou incorrecte`,
      'Prompt de correction des exercices',
    );
  }

  if (!db.prepare('SELECT id FROM api_keys WHERE provider = ?').get('claude')) {
    db.prepare("INSERT INTO api_keys (provider, api_key) VALUES ('claude', '')").run();
  }
  if (!db.prepare('SELECT id FROM api_keys WHERE provider = ?').get('gemini')) {
    db.prepare("INSERT INTO api_keys (provider, api_key) VALUES ('gemini', '')").run();
  }
}
