import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStudents, getReferenceData, createSession } from '../api/client.js';

export default function GeneratePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    student_id: '',
    subject: '',
    topic: '',
    difficulty: 'normal',
    num_exercises: 5,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: ref } = useQuery({ queryKey: ['reference'], queryFn: getReferenceData });

  const levels = ref?.levels || [];
  const subjects = ref?.subjects || [];
  const difficulties = ref?.difficulties || [];

  // Filter subjects by selected student's level
  const selectedStudent = students.find(s => String(s.id) === String(form.student_id));
  const filteredSubjects = selectedStudent
    ? subjects.filter(s => s.levels === 'all' || s.levels.includes(selectedStudent.level))
    : subjects;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('images', f));
      return createSession(fd);
    },
    onSuccess: (session) => navigate(`/session/${session.id}`),
    onError: (err) => setError(err.response?.data?.error || 'Erreur lors de la génération'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.student_id) return setError('Sélectionne un élève');
    if (!form.subject) return setError('Sélectionne une matière');
    if (!form.topic.trim()) return setError('Indique le sujet de l\'exercice');
    mutation.mutate(form);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Générer des exercices</h1>
        <p className="text-gray-500 text-sm mt-1">L'IA va créer des exercices personnalisés selon le profil de l'élève</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">1</span>
            Profil élève
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Élève</label>
              <select className="select" value={form.student_id} onChange={set('student_id')}>
                <option value="">— Choisir un élève —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
                ))}
              </select>
            </div>
            {selectedStudent && (
              <button
                type="button"
                onClick={() => navigate(`/history/${selectedStudent.id}`)}
                className="btn-secondary text-xs"
              >
                Voir l'historique
              </button>
            )}
          </div>
          {students.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Aucun élève enregistré —{' '}
              <button type="button" onClick={() => navigate('/admin')} className="underline">créer un élève dans Admin</button>
            </p>
          )}
        </div>

        {/* Subject & topic */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">2</span>
            Matière et sujet
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Matière</label>
              <select className="select" value={form.subject} onChange={set('subject')}>
                <option value="">— Choisir —</option>
                {filteredSubjects.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulté</label>
              <select className="select" value={form.difficulty} onChange={set('difficulty')}>
                {difficulties.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Point sur lequel porte l'exercice</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Ex: Les fractions, La Révolution française, La conjugaison du passé composé..."
              value={form.topic}
              onChange={set('topic')}
            />
          </div>
          <div>
            <label className="label">Nombre d'exercices</label>
            <input
              type="number"
              className="input w-28"
              min={1}
              max={20}
              value={form.num_exercises}
              onChange={set('num_exercises')}
            />
          </div>
        </div>

        {/* Upload */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">3</span>
            Contenu de référence <span className="text-gray-400 font-normal text-sm">(optionnel)</span>
          </h2>
          <p className="text-xs text-gray-500 mb-3">Photos d'un cours ou d'exercices existants — l'IA s'en inspirera</p>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full border-dashed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Ajouter des images (max 5)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-lg px-2 py-1 text-xs">
                  <span className="truncate max-w-32">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="hover:text-red-500 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              Génération en cours…
            </span>
          ) : (
            'Générer les exercices →'
          )}
        </button>
      </form>
    </div>
  );
}
