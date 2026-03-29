import { Router } from 'express';
import * as ctrl from '../controllers/studentController.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.createWithStatus);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/sessions', ctrl.history);

export default router;
