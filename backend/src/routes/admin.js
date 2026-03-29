import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';

const router = Router();

router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

router.get('/api-keys', ctrl.getApiKeys);
router.put('/api-keys/:provider', ctrl.updateApiKey);

router.get('/prompts', ctrl.getPrompts);
router.get('/prompts/:name', ctrl.getPrompt);
router.put('/prompts/:name', ctrl.updatePrompt);

router.get('/reference', ctrl.getReferenceData);

export default router;
