import * as studentService from '../services/studentService.js';

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    if (result !== undefined) res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

export const list = handle((_req) => studentService.listStudents());

export const getOne = handle((req) => studentService.getStudent(Number(req.params.id)));

export const create = handle((req) => {
  const student = studentService.createStudent(req.body);
  // Express doesn't expose res in handle's fn easily for status 201, so we patch:
  return student; // caller sets 201 in route
});

export const createWithStatus = async (req, res) => {
  try {
    const student = studentService.createStudent(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

export const update = handle((req) =>
  studentService.updateStudent(Number(req.params.id), req.body)
);

export const remove = handle(async (req) => {
  studentService.deleteStudent(Number(req.params.id));
  return { ok: true };
});

export const history = handle((req) =>
  studentService.getStudentHistory(Number(req.params.id))
);
