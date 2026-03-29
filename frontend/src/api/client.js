import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000, // LLM calls can be slow
});

// ── Students ──────────────────────────────────────────────────────────────────

export const getStudents = () => api.get('/students').then(r => r.data);
export const getStudent = (id) => api.get(`/students/${id}`).then(r => r.data);
export const createStudent = (data) => api.post('/students', data).then(r => r.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then(r => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(r => r.data);
export const getStudentSessions = (id) => api.get(`/students/${id}/sessions`).then(r => r.data);

// ── Sessions ──────────────────────────────────────────────────────────────────

export const getSession = (id) => api.get(`/sessions/${id}`).then(r => r.data);

export const createSession = (formData) =>
  api.post('/sessions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

export const saveAnswer = (sessionId, exerciseId, studentAnswer) =>
  api.put(`/sessions/${sessionId}/exercises/${exerciseId}/answer`, { student_answer: studentAnswer }).then(r => r.data);

export const correctSession = (sessionId) =>
  api.post(`/sessions/${sessionId}/correct`).then(r => r.data);

export const completeSession = (sessionId) =>
  api.put(`/sessions/${sessionId}/complete`).then(r => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getSettings = () => api.get('/admin/settings').then(r => r.data);
export const updateSettings = (data) => api.put('/admin/settings', data).then(r => r.data);

export const getApiKeys = () => api.get('/admin/api-keys').then(r => r.data);
export const updateApiKey = (provider, data) => api.put(`/admin/api-keys/${provider}`, data).then(r => r.data);

export const getPrompts = () => api.get('/admin/prompts').then(r => r.data);
export const getPrompt = (name) => api.get(`/admin/prompts/${name}`).then(r => r.data);
export const updatePrompt = (name, data) => api.put(`/admin/prompts/${name}`, data).then(r => r.data);

export const getReferenceData = () => api.get('/admin/reference').then(r => r.data);
