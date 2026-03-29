import * as adminService from '../services/adminService.js';

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    if (result !== undefined) res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

export const getSettings = handle(() => adminService.getSettings());

export const updateSettings = handle((req) => {
  adminService.updateSettings(req.body);
  return { ok: true };
});

export const getApiKeys = handle(() => adminService.getApiKeys());

export const updateApiKey = handle((req) => {
  adminService.updateApiKey(req.params.provider, req.body);
  return { ok: true };
});

export const getPrompts = handle(() => adminService.getPrompts());

export const getPrompt = handle((req) => adminService.getPrompt(req.params.name));

export const updatePrompt = handle((req) => {
  adminService.updatePrompt(req.params.name, req.body);
  return { ok: true };
});

export const getReferenceData = handle(() => adminService.getReferenceData());
