import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './src/db/index.js';
import studentsRouter from './src/routes/students.js';
import sessionsRouter from './src/routes/sessions.js';
import adminRouter from './src/routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(cors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));

initDb();

app.use('/api/students', studentsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve frontend static files in production
if (process.env['NODE_ENV'] === 'production') {
  const staticDir = path.join(__dirname, 'public');
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
