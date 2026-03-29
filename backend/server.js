import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './src/db/index.js';
import studentsRouter from './src/routes/students.js';
import sessionsRouter from './src/routes/sessions.js';
import adminRouter from './src/routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));

// Init DB
initDb();

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
