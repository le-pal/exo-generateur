import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/sessionController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

const router = Router();

router.get('/:id', ctrl.getOne);
router.post('/', upload.array('images', 5), ctrl.create);
router.put('/:sessionId/exercises/:exerciseId/answer', ctrl.saveAnswer);
router.post('/:id/correct', ctrl.correct);
router.put('/:id/complete', ctrl.complete);

export default router;
