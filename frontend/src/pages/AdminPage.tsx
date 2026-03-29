import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  getApiKeys, updateApiKey,
  getPrompts, updatePrompt,
  getSettings, updateSettings,
  getReferenceData,
} from '../api/client.ts';
import type { Student, Prompt, ApiKeyInfo } from '../types/api.ts';

const TABS = ['Élèves', 'Modèle & Clés API', 'Prompts'] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('Élèves');
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configuration de l'application</p>
        </div>
        <button onClick={() => void navigate('/')} className="btn-ghost text-sm">← Retour</button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Élèves' && <StudentsTab />}
      {tab === 'Modèle & Clés API' && <ApiKeysTab />}
      {tab === 'Prompts' && <PromptsTab />}
    </div>
  );
}

// ── Students ──────────────────────────────────────────────────────────────────

function StudentsTab() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('6ème');
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; level: string }>({ name: '', level: '' });
  const [error, setError] = useState('');

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: ref } = useQuery({ queryKey: ['reference'], queryFn: getReferenceData });
  const levels = ref?.levels ?? [];

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['students'] });

  const createMutation = useMutation({
    mutationFn: () => createStudent({ name: newName, level: newLevel }),
    onSuccess: () => { setNewName(''); invalidate(); setError(''); },
    onError: (e: { response?: { data?: { error?: string } } }) => setError(e.response?.data?.error ?? 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; level: string } }) => updateStudent(id, data),
    onSuccess: () => { setEditId(null); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => invalidate(),
  });

  const startEdit = (s: Student) => { setEditId(s.id); setEditData({ name: s.name, level: s.level }); };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Ajouter un élève</h2>
        <div className="flex gap-3">
          <input className="input flex-1" placeholder="Prénom et nom" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate(); }} />
          <select className="select w-32" value={newLevel} onChange={e => setNewLevel(e.target.value)}>
            {levels.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
          </select>
          <button className="btn-primary whitespace-nowrap"
            onClick={() => { if (!newName.trim()) return setError('Nom requis'); createMutation.mutate(); }}
            disabled={createMutation.isPending}>
            Ajouter
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Élèves ({students.length})</h2>
        {students.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun élève enregistré</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map(s => (
              <li key={s.id} className="py-3 flex items-center gap-3">
                {editId === s.id ? (
                  <>
                    <input className="input flex-1" value={editData.name}
                      onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                    <select className="select w-28" value={editData.level}
                      onChange={e => setEditData(d => ({ ...d, level: e.target.value }))}>
                      {levels.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
                    </select>
                    <button className="btn-primary text-xs" onClick={() => updateMutation.mutate({ id: s.id, data: editData })}>Sauver</button>
                    <button className="btn-ghost text-xs" onClick={() => setEditId(null)}>Annuler</button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className="ml-2 badge bg-blue-50 text-blue-700">{s.level}</span>
                    </div>
                    <button className="btn-ghost text-xs" onClick={() => startEdit(s)}>Modifier</button>
                    <button className="btn-ghost text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { if (confirm(`Supprimer ${s.name} ?`)) deleteMutation.mutate(s.id); }}>
                      Supprimer
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── API Keys ──────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-api03-…' },
  { id: 'gemini', label: 'Gemini (Google)', placeholder: 'AIza…' },
] as const;

function ApiKeysTab() {
  const qc = useQueryClient();
  const { data: keys = [] } = useQuery<ApiKeyInfo[]>({ queryKey: ['api-keys'], queryFn: getApiKeys });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const saveMutation = useMutation({
    mutationFn: ({ provider, api_key }: { provider: string; api_key: string }) => updateApiKey(provider, { api_key }),
    onSuccess: (_, { provider }) => {
      void qc.invalidateQueries({ queryKey: ['api-keys'] });
      setSaved(s => ({ ...s, [provider]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [provider]: false })), 2000);
    },
  });

  const modelMutation = useMutation({
    mutationFn: (model: string) => updateSettings({ default_model: model }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Modèle par défaut</h2>
        <div className="flex gap-3">
          {PROVIDERS.map(p => {
            const active = settings?.default_model === p.id;
            return (
              <button key={p.id} onClick={() => modelMutation.mutate(p.id)}
                className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="font-semibold text-gray-800">{p.label}</div>
                {active && <div className="text-xs text-blue-600 mt-1 font-medium">✓ Sélectionné</div>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">Ce modèle sera utilisé pour toutes les générations par défaut.</p>
      </div>

      {PROVIDERS.map(p => {
        const keyRow = keys.find(k => k.provider === p.id);
        const currentVal = keyValues[p.id] ?? '';
        return (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">{p.label}</h2>
              {keyRow?.is_set === 1 && <span className="badge bg-green-100 text-green-700">Clé configurée</span>}
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type={showKey[p.id] ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder={keyRow?.is_set ? '••••••••••••••••' : p.placeholder}
                  value={currentVal}
                  onChange={e => setKeyValues(v => ({ ...v, [p.id]: e.target.value }))}
                />
                <button type="button" onClick={() => setShowKey(s => ({ ...s, [p.id]: !s[p.id] }))}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  {showKey[p.id] ? '🙈' : '👁'}
                </button>
              </div>
              <button
                className={`btn-primary whitespace-nowrap ${saved[p.id] ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => saveMutation.mutate({ provider: p.id, api_key: currentVal })}
                disabled={saveMutation.isPending || !currentVal}>
                {saved[p.id] ? '✓ Sauvé' : 'Sauvegarder'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {p.id === 'claude' ? 'Obtenez votre clé sur console.anthropic.com' : 'Obtenez votre clé sur aistudio.google.com'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const PROMPT_VARS: Record<string, string[]> = {
  generation: ['{{subject}}', '{{level}}', '{{topic}}', '{{difficulty}}', '{{num_exercises}}', '{{uploaded_content}}', '{{#if uploaded_content}}…{{/if}}'],
  correction: ['{{subject}}', '{{level}}', '{{exercises_and_answers}}'],
};

function PromptsTab() {
  const qc = useQueryClient();
  const { data: prompts = [] } = useQuery<Prompt[]>({ queryKey: ['prompts'], queryFn: getPrompts });
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  const startEdit = (p: Prompt) => { setEditing(p.name); setContent(p.content); setSaved(false); };

  const saveMutation = useMutation({
    mutationFn: () => updatePrompt(editing!, { content }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prompts'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (editing) {
    const prompt = prompts.find(p => p.name === editing);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg capitalize">{editing}</h2>
            <p className="text-sm text-gray-500">{prompt?.description}</p>
          </div>
          <button onClick={() => setEditing(null)} className="btn-ghost text-sm">← Retour</button>
        </div>
        <div className="card">
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1 font-medium">Variables disponibles :</p>
            <div className="flex flex-wrap gap-1">
              {(PROMPT_VARS[prompt?.type ?? ''] ?? []).map(v => (
                <code key={v} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">{v}</code>
              ))}
            </div>
          </div>
          <textarea className="input font-mono text-xs resize-y" rows={20} value={content} onChange={e => setContent(e.target.value)} />
          <div className="flex gap-3 mt-3">
            <button className={`btn-primary ${saved ? 'bg-green-500 hover:bg-green-600' : ''}`}
              onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saved ? '✓ Sauvegardé' : 'Sauvegarder'}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map(p => (
        <div key={p.id} className="card flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 capitalize">{p.name}</span>
              <span className={`badge ${p.type === 'generation' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.type}</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{p.description}</p>
            <p className="text-xs text-gray-400">Modifié le {new Date(p.updated_at).toLocaleDateString('fr-FR')}</p>
          </div>
          <button className="btn-secondary text-xs ml-4" onClick={() => startEdit(p)}>Modifier</button>
        </div>
      ))}
    </div>
  );
}
