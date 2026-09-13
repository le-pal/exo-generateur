import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// Public: no admin session required yet.
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
// Used by the public "Générer" flow too (levels/subjects/models list) — not sensitive.
router.get('/reference', ctrl.getReferenceData);

router.get('/settings', requireAdmin, ctrl.getSettings);
router.put('/settings', requireAdmin, ctrl.updateSettings);

router.get('/api-keys', requireAdmin, ctrl.getApiKeys);
router.put('/api-keys/:provider', requireAdmin, ctrl.updateApiKey);
router.post('/api-keys/:provider/test', requireAdmin, ctrl.testApiKey);

router.get('/prompts', requireAdmin, ctrl.getPrompts);
router.get('/prompts/:name', requireAdmin, ctrl.getPrompt);
router.put('/prompts/:name', requireAdmin, ctrl.updatePrompt);

export default router;
