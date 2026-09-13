import { Router } from 'express';
import * as ctrl from '../controllers/studentController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// Public: the "Générer" and historique pages need to read students without an admin session.
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/sessions', ctrl.history);

// Admin-only: creating/editing/removing student profiles.
router.post('/', requireAdmin, ctrl.createWithStatus);
router.put('/:id', requireAdmin, ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

export default router;
