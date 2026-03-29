import * as sessionService from '../services/sessionService.js';

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    if (result !== undefined) res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

export const getOne = handle((req) => sessionService.getSession(Number(req.params.id)));

export const create = async (req, res) => {
  try {
    const images = (req.files ?? []).map(f => ({
      mediaType: f.mimetype,
      data: f.buffer.toString('base64'),
    }));

    const session = await sessionService.generateSession({
      student_id: req.body.student_id,
      subject: req.body.subject,
      topic: req.body.topic,
      difficulty: req.body.difficulty,
      num_exercises: req.body.num_exercises,
      model: req.body.model,
      images,
      uploadedText: req.body.uploaded_text,
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

export const saveAnswer = handle(async (req) => {
  sessionService.saveAnswer(
    Number(req.params.sessionId),
    Number(req.params.exerciseId),
    req.body.student_answer,
  );
  return { ok: true };
});

export const correct = handle((req) => sessionService.correctSession(Number(req.params.id)));

export const complete = handle(async (req) => {
  sessionService.completeSession(Number(req.params.id));
  return { ok: true };
});
