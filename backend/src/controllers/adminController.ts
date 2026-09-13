import type { Request, RequestHandler } from 'express';
import * as adminService from '../services/adminService.js';
import { login as authLogin, logout as authLogout } from '../services/authService.js';
import { AppError } from '../types/index.js';

type Handler = (req: Request) => Promise<unknown> | unknown;

const handle = (fn: Handler): RequestHandler =>
  async (req, res) => {
    try {
      const result = await fn(req);
      if (result !== undefined) res.json(result);
    } catch (err) {
      const { message, status = 500 } = err as AppError;
      res.status(status).json({ error: message });
    }
  };

export const login: RequestHandler = (req, res) => {
  const { password } = req.body as { password?: string };
  const token = authLogin(password ?? '');
  if (!token) { res.status(401).json({ error: 'Mot de passe incorrect' }); return; }
  res.json({ token });
};

export const logout: RequestHandler = (req, res) => {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  authLogout(token);
  res.json({ ok: true });
};

export const getSettings = handle(() => adminService.getSettings());

export const updateSettings = handle((req) => {
  adminService.updateSettings(req.body as Record<string, string>);
  return { ok: true };
});

export const getApiKeys = handle(() => adminService.getApiKeys());

export const updateApiKey = handle((req) => {
  const provider = Array.isArray(req.params['provider']) ? req.params['provider'][0]! : req.params['provider']!;
  adminService.updateApiKey(provider, req.body as { api_key?: string; active?: boolean });
  return { ok: true };
});

export const getPrompts = handle(() => adminService.getPrompts());

export const getPrompt = handle((req) => {
  const name = Array.isArray(req.params['name']) ? req.params['name'][0]! : req.params['name']!;
  return adminService.getPrompt(name);
});

export const updatePrompt = handle((req) => {
  const name = Array.isArray(req.params['name']) ? req.params['name'][0]! : req.params['name']!;
  adminService.updatePrompt(name, req.body as { content?: string; description?: string });
  return { ok: true };
});

export const testApiKey = handle(async (req) => {
  const provider = Array.isArray(req.params['provider']) ? req.params['provider'][0]! : req.params['provider']!;
  return adminService.testApiKey(provider);
});

export const getReferenceData = handle(() => adminService.getReferenceData());

export const getErrorExchanges = handle(() => adminService.getErrorExchanges());
