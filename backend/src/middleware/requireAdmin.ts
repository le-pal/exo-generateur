import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'Authentification admin requise' });
    return;
  }
  next();
}
