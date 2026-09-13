import axios from 'axios';
import type {
  Student, SessionView, StudentSessionSummary,
  Prompt, ApiKeyInfo, ReferenceData, LlmExchange,
} from '../types/api.ts';

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000,
});

const ADMIN_TOKEN_KEY = 'admin_token';

api.interceptors.request.use(config => {
  let token: string | null = null;
  try { token = localStorage.getItem(ADMIN_TOKEN_KEY); } catch { /* private mode, etc. */ }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      try {
        if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          window.location.reload();
        }
      } catch { /* private mode, etc. */ }
    }
    return Promise.reject(err);
  },
);

// ── Students ──────────────────────────────────────────────────────────────────

export const getStudents = (): Promise<Student[]> => api.get('/students').then(r => r.data);
export const getStudent = (id: number): Promise<Student> => api.get(`/students/${id}`).then(r => r.data);
export const createStudent = (data: { name: string; level: string }): Promise<Student> => api.post('/students', data).then(r => r.data);
export const updateStudent = (id: number, data: { name?: string; level?: string }): Promise<Student> => api.put(`/students/${id}`, data).then(r => r.data);
export const deleteStudent = (id: number): Promise<{ ok: boolean }> => api.delete(`/students/${id}`).then(r => r.data);
export const getStudentSessions = (id: number): Promise<StudentSessionSummary[]> => api.get(`/students/${id}/sessions`).then(r => r.data);

// ── Sessions ──────────────────────────────────────────────────────────────────

export const getSession = (id: number): Promise<SessionView> => api.get(`/sessions/${id}`).then(r => r.data);

export const createSession = (formData: FormData): Promise<SessionView> =>
  api.post('/sessions', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const saveAnswer = (sessionId: number, exerciseId: number, studentAnswer: string): Promise<{ ok: boolean }> =>
  api.put(`/sessions/${sessionId}/exercises/${exerciseId}/answer`, { student_answer: studentAnswer }).then(r => r.data);

export const correctSession = (sessionId: number): Promise<SessionView> =>
  api.post(`/sessions/${sessionId}/correct`).then(r => r.data);

export const completeSession = (sessionId: number): Promise<{ ok: boolean }> =>
  api.put(`/sessions/${sessionId}/complete`).then(r => r.data);

export const getSessionTrace = (sessionId: number): Promise<LlmExchange[]> =>
  api.get(`/sessions/${sessionId}/trace`).then(r => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminLogin = (password: string): Promise<{ token: string }> =>
  api.post('/admin/login', { password }).then(r => r.data);

export const adminLogout = (): Promise<{ ok: boolean }> =>
  api.post('/admin/logout').then(r => r.data);

export const getSettings = (): Promise<Record<string, string>> => api.get('/admin/settings').then(r => r.data);
export const updateSettings = (data: Record<string, string>): Promise<{ ok: boolean }> => api.put('/admin/settings', data).then(r => r.data);

export const getApiKeys = (): Promise<ApiKeyInfo[]> => api.get('/admin/api-keys').then(r => r.data);
export const updateApiKey = (provider: string, data: { api_key?: string; active?: boolean }): Promise<{ ok: boolean }> =>
  api.put(`/admin/api-keys/${provider}`, data).then(r => r.data);

export const testApiKey = (provider: string): Promise<{ ok: boolean; error?: string }> =>
  api.post(`/admin/api-keys/${provider}/test`).then(r => r.data);

export const getPrompts = (): Promise<Prompt[]> => api.get('/admin/prompts').then(r => r.data);
export const getPrompt = (name: string): Promise<Prompt> => api.get(`/admin/prompts/${name}`).then(r => r.data);
export const updatePrompt = (name: string, data: { content?: string; description?: string }): Promise<{ ok: boolean }> =>
  api.put(`/admin/prompts/${name}`, data).then(r => r.data);

export const getReferenceData = (): Promise<ReferenceData> => api.get('/admin/reference').then(r => r.data);
