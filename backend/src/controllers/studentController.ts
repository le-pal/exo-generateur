import type { Request, Response, RequestHandler } from 'express';
import * as studentService from '../services/studentService.js';
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

export const list = handle(() => studentService.listStudents());

export const getOne = handle((req) => studentService.getStudent(Number(req.params['id'])));

export const createWithStatus: RequestHandler = async (req, res) => {
  try {
    const student = studentService.createStudent(req.body as { name?: string; level?: string });
    res.status(201).json(student);
  } catch (err) {
    const { message, status = 500 } = err as AppError;
    res.status(status).json({ error: message });
  }
};

export const update = handle((req) =>
  studentService.updateStudent(Number(req.params['id']), req.body as { name?: string; level?: string })
);

export const remove = handle(async (req) => {
  studentService.deleteStudent(Number(req.params['id']));
  return { ok: true };
});

export const history = handle((req) =>
  studentService.getStudentHistory(Number(req.params['id']))
);
