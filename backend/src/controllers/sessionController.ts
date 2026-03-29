import type { Request, Response, RequestHandler } from 'express';
import * as sessionService from '../services/sessionService.js';
import { AppError } from '../types/index.js';
import type { LlmModel, Difficulty, ImagePayload } from '../types/index.js';

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

export const getOne = handle((req) => sessionService.getSession(Number(req.params['id'])));

export const create: RequestHandler = async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const images: ImagePayload[] = files.map(f => ({
      mediaType: f.mimetype,
      data: f.buffer.toString('base64'),
    }));

    const body = req.body as {
      student_id: string;
      subject: string;
      topic: string;
      difficulty?: Difficulty;
      num_exercises?: string;
      model?: LlmModel;
      uploaded_text?: string;
    };

    const session = await sessionService.generateSession({
      student_id: Number(body.student_id),
      subject: body.subject,
      topic: body.topic,
      difficulty: body.difficulty,
      num_exercises: body.num_exercises ? Number(body.num_exercises) : undefined,
      model: body.model,
      images,
      uploadedText: body.uploaded_text,
    });
    res.status(201).json(session);
  } catch (err) {
    const { message, status = 500 } = err as AppError;
    res.status(status).json({ error: message });
  }
};

export const saveAnswer = handle(async (req) => {
  sessionService.saveAnswer(
    Number(req.params['sessionId']),
    Number(req.params['exerciseId']),
    (req.body as { student_answer?: string }).student_answer ?? '',
  );
  return { ok: true };
});

export const correct = handle((req) => sessionService.correctSession(Number(req.params['id'])));

export const complete = handle(async (req) => {
  sessionService.completeSession(Number(req.params['id']));
  return { ok: true };
});
