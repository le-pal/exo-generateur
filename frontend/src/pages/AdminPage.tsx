import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  getApiKeys, updateApiKey, testApiKey, listProviderModels,
  getPrompts, updatePrompt,
  getSettings, updateSettings,
  getReferenceData,
  getDebugLogs, clearDebugLogs,
} from '../api/client.ts';
import type { Student, Prompt, ApiKeyInfo, ModelDefinition, LlmLogEntry } from '../types/api.ts';

const TABS = ['Élèves', 'Modèle & Clés API', 'Prompts', 'Debug'] as const;
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
      {tab === 'Debug' && <DebugTab />}
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

const STATIC_PROVIDERS = [
  { id: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-api03-…', link: 'console.anthropic.com' },
  { id: 'gemini', label: 'Gemini (Google)', placeholder: 'AIza…', link: 'aistudio.google.com' },
] as const;

interface TestState {
  status: 'idle' | 'testing' | 'ok' | 'error';
  error?: string;
}

function ApiKeysTab() {
  const qc = useQueryClient();
  const { data: keys = [] } = useQuery<ApiKeyInfo[]>({ queryKey: ['api-keys'], queryFn: getApiKeys });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ['settings'], queryFn: getSettings });
  const { data: ref } = useQuery({ queryKey: ['reference'], queryFn: getReferenceData });
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testState, setTestState] = useState<Record<string, TestState>>({});
  const [orBaseUrl, setOrBaseUrl] = useState('');
  const [orModels, setOrModels] = useState<ModelDefinition[]>([]);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState('');

  const runTest = async (provider: string) => {
    setTestState(s => ({ ...s, [provider]: { status: 'testing' } }));
    try {
      const result = await testApiKey(provider);
      setTestState(s => ({
        ...s,
        [provider]: result.ok ? { status: 'ok' } : { status: 'error', error: result.error },
      }));
    } catch {
      setTestState(s => ({ ...s, [provider]: { status: 'error', error: 'Erreur réseau' } }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: ({ provider, api_key }: { provider: string; api_key: string }) =>
      updateApiKey(provider, { api_key }),
    onSuccess: (_, { provider }) => {
      void qc.invalidateQueries({ queryKey: ['api-keys'] });
      setKeyValues(v => ({ ...v, [provider]: '' }));
      void runTest(provider);
    },
    onError: (_err, { provider }) => {
      setTestState(s => ({ ...s, [provider]: { status: 'error', error: 'Erreur lors de la sauvegarde' } }));
    },
  });

  const modelMutation = useMutation({
    mutationFn: (payload: { model: string; meta?: string }) =>
      updateSettings({ default_model: payload.model, ...(payload.meta ? { openrouter_selected_model_meta: payload.meta } : {}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] });
      void qc.invalidateQueries({ queryKey: ['reference'] });
    },
  });

  const baseUrlMutation = useMutation({
    mutationFn: (url: string) => updateSettings({ openrouter_base_url: url }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const allModels = ref?.models ?? [];
  const currentModel = settings?.['default_model'] ?? '';
  const savedBaseUrl = settings?.['openrouter_base_url'] ?? 'https://openrouter.ai/api/v1';
  const orKeyRow = keys.find(k => k.provider === 'openrouter');

  const fetchOrModels = async () => {
    setOrLoading(true);
    setOrError('');
    try {
      const models = await listProviderModels('openrouter');
      setOrModels(models);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error
        ?? (e as { message?: string }).message
        ?? 'Erreur';
      setOrError(msg);
    } finally {
      setOrLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Default model */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Modèle par défaut</h2>
        {allModels.length === 0 ? (
          <p className="text-sm text-amber-600">Aucune clé API active — configurez une clé ci-dessous.</p>
        ) : (
          <div className="space-y-3">
            {[...STATIC_PROVIDERS, { id: 'openrouter', label: 'OpenRouter / API compatible', placeholder: '', link: '' }]
              .filter(p => allModels.some(m => m.provider === p.id))
              .map(p => (
                <div key={p.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{p.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {allModels.filter(m => m.provider === p.id).map(m => {
                      const active = currentModel === m.id;
                      return (
                        <button key={m.id} onClick={() => modelMutation.mutate({ model: m.id, meta: JSON.stringify(m) })}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className={`font-medium text-sm ${active ? 'text-blue-800' : 'text-gray-800'}`}>{m.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{m.description}</div>
                          {active && <div className="text-xs text-blue-600 mt-1 font-semibold">✓ Sélectionné</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">Ce modèle sera utilisé pour toutes les générations.</p>
      </div>

      {/* Static providers */}
      {STATIC_PROVIDERS.map(p => {
        const keyRow = keys.find(k => k.provider === p.id);
        const currentVal = keyValues[p.id] ?? '';
        const ts = testState[p.id] ?? { status: 'idle' };
        const isSaving = saveMutation.isPending && saveMutation.variables?.provider === p.id;

        return (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">{p.label}</h2>
              <ApiKeyStatusBadge keyRow={keyRow} testState={ts} />
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
                className="btn-primary whitespace-nowrap"
                onClick={() => saveMutation.mutate({ provider: p.id, api_key: currentVal })}
                disabled={isSaving || ts.status === 'testing' || !currentVal}>
                {isSaving || ts.status === 'testing' ? (
                  <span className="flex items-center gap-1.5"><Spinner /> {isSaving ? 'Sauvegarde…' : 'Test…'}</span>
                ) : 'Sauvegarder & tester'}
              </button>
            </div>
            {ts.status === 'ok' && <StatusBanner ok />}
            {ts.status === 'error' && <StatusBanner ok={false} error={ts.error} />}
            <p className="text-xs text-gray-400 mt-2">Obtenez votre clé sur {p.link}</p>
          </div>
        );
      })}

      {/* OpenRouter */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">OpenRouter / API OpenAI-compatible</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fonctionne aussi avec LM Studio, vLLM, Ollama…</p>
          </div>
          <ApiKeyStatusBadge keyRow={orKeyRow} testState={testState['openrouter'] ?? { status: 'idle' }} />
        </div>

        {/* Base URL */}
        <div className="mb-3">
          <label className="label text-xs">URL de base de l'API</label>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono text-sm"
              placeholder="https://openrouter.ai/api/v1"
              value={orBaseUrl || savedBaseUrl}
              onChange={e => setOrBaseUrl(e.target.value)}
            />
            <button
              className="btn-secondary whitespace-nowrap text-sm"
              onClick={() => {
                const url = orBaseUrl || savedBaseUrl;
                baseUrlMutation.mutate(url);
              }}
              disabled={baseUrlMutation.isPending}>
              {baseUrlMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <input
              type={showKey['openrouter'] ? 'text' : 'password'}
              className="input pr-10"
              placeholder={orKeyRow?.is_set ? '••••••••••••••••' : 'sk-or-v1-…'}
              value={keyValues['openrouter'] ?? ''}
              onChange={e => setKeyValues(v => ({ ...v, openrouter: e.target.value }))}
            />
            <button type="button" onClick={() => setShowKey(s => ({ ...s, openrouter: !s['openrouter'] }))}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
              {showKey['openrouter'] ? '🙈' : '👁'}
            </button>
          </div>
          <button
            className="btn-primary whitespace-nowrap"
            onClick={() => saveMutation.mutate({ provider: 'openrouter', api_key: keyValues['openrouter'] ?? '' })}
            disabled={saveMutation.isPending || !keyValues['openrouter']}>
            Sauvegarder & tester
          </button>
        </div>

        {testState['openrouter']?.status === 'ok' && <StatusBanner ok />}
        {testState['openrouter']?.status === 'error' && <StatusBanner ok={false} error={testState['openrouter'].error} />}

        {/* Model listing */}
        {orKeyRow?.is_set === 1 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Modèles disponibles</p>
              <button
                className="btn-secondary text-xs"
                onClick={() => void fetchOrModels()}
                disabled={orLoading}>
                {orLoading ? <span className="flex items-center gap-1"><Spinner /> Chargement…</span> : '↻ Récupérer les modèles'}
              </button>
            </div>
            {orError && <p className="text-red-600 text-sm mb-2">{orError}</p>}
            {orModels.length > 0 && (
              <OpenRouterModelList
                models={orModels}
                currentModel={currentModel}
                onSelect={(m) => modelMutation.mutate({ model: m.id, meta: JSON.stringify(m) })}
              />
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Obtenez votre clé sur <span className="font-mono">openrouter.ai</span> — des centaines de modèles disponibles
        </p>
      </div>
    </div>
  );
}

function OpenRouterModelList({ models, currentModel, onSelect }: {
  models: ModelDefinition[];
  currentModel: string;
  onSelect: (m: ModelDefinition) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? models.filter(m => m.label.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
    : models;

  return (
    <div>
      <input
        className="input mb-2 text-sm"
        placeholder="Filtrer les modèles…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-gray-200 p-1">
        {filtered.slice(0, 100).map(m => {
          const active = currentModel === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${active ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={`font-medium text-sm truncate ${active ? 'text-blue-800' : 'text-gray-800'}`}>{m.label}</div>
                  <div className="text-xs text-gray-400 font-mono truncate">{m.id.replace('or:', '')}</div>
                </div>
                {active && <span className="text-xs text-blue-600 font-semibold shrink-0">✓</span>}
              </div>
            </button>
          );
        })}
        {filtered.length > 100 && (
          <p className="text-xs text-gray-400 text-center py-2">… et {filtered.length - 100} autres. Affinez la recherche.</p>
        )}
        {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucun modèle trouvé</p>}
      </div>
    </div>
  );
}

function ApiKeyStatusBadge({ keyRow, testState }: { keyRow: ApiKeyInfo | undefined; testState: TestState }) {
  if (testState.status === 'ok') return <span className="badge bg-green-100 text-green-700">✓ Clé valide</span>;
  if (testState.status === 'error') return <span className="badge bg-red-100 text-red-700">✗ Clé invalide</span>;
  if (testState.status === 'testing') return <span className="badge bg-blue-100 text-blue-700">Test…</span>;
  if (keyRow?.is_set === 1) return <span className="badge bg-gray-100 text-gray-600">Clé configurée</span>;
  return null;
}

function StatusBanner({ ok, error }: { ok: boolean; error?: string }) {
  if (ok) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span>✓</span><span>Clé valide — connexion réussie</span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <span className="shrink-0">✗</span>
      <span><span className="font-medium">Clé invalide : </span>{error}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
    </svg>
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

// ── Debug ─────────────────────────────────────────────────────────────────────

function DebugTab() {
  const qc = useQueryClient();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ['settings'], queryFn: getSettings });
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['debug-logs'],
    queryFn: () => getDebugLogs(50),
    enabled: settings?.['debug_mode'] === 'true',
    refetchOnWindowFocus: false,
  });

  const [expanded, setExpanded] = useState<number | null>(null);

  const debugEnabled = settings?.['debug_mode'] === 'true';

  const toggleDebug = useMutation({
    mutationFn: (enabled: boolean) => updateSettings({ debug_mode: String(enabled) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearDebugLogs,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['debug-logs'] }),
  });

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Mode debug</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enregistre les trames complètes (prompt + réponse) de chaque échange LLM dans un fichier de log.
            </p>
          </div>
          <button
            onClick={() => toggleDebug.mutate(!debugEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${debugEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${debugEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {debugEnabled && logsData?.logFile && (
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Fichier : {logsData.logFile}
          </p>
        )}
        {!debugEnabled && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ Le mode debug peut générer de gros fichiers de logs. Désactivez-le en production.
          </div>
        )}
      </div>

      {/* Logs */}
      {debugEnabled && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">
              Derniers échanges {logsData ? `(${logsData.logs.length})` : ''}
            </h2>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => void refetch()} disabled={isLoading}>
                {isLoading ? 'Chargement…' : '↻ Rafraîchir'}
              </button>
              <button
                className="btn-ghost text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => { if (confirm('Effacer tous les logs ?')) clearMutation.mutate(); }}
                disabled={clearMutation.isPending}>
                Effacer
              </button>
            </div>
          </div>

          {!logsData?.logs.length ? (
            <p className="text-sm text-gray-400">Aucun log enregistré. Générez un exercice pour voir les trames.</p>
          ) : (
            <div className="space-y-2">
              {logsData.logs.map((log, i) => (
                <LogEntry key={i} log={log} index={i} expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LogEntry({ log, index, expanded, onToggle }: { log: LlmLogEntry; index: number; expanded: boolean; onToggle: () => void }) {
  const ts = new Date(log.timestamp);
  const timeStr = ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = ts.toLocaleDateString('fr-FR');

  return (
    <div className={`rounded-lg border transition-colors ${log.error ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={onToggle}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${log.error ? 'bg-red-500' : 'bg-green-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-gray-700">{log.model}</span>
            <span className="badge bg-gray-100 text-gray-500 text-xs">{log.provider}</span>
            {log.images_count > 0 && <span className="badge bg-blue-100 text-blue-600 text-xs">{log.images_count} image(s)</span>}
            {log.error && <span className="badge bg-red-100 text-red-600 text-xs">Erreur</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{dateStr} {timeStr} — {log.duration_ms} ms</div>
        </div>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <LogSection title="Prompt" content={log.prompt} />
          {log.response && <LogSection title="Réponse" content={log.response} />}
          {log.error && <LogSection title="Erreur" content={log.error} isError />}
        </div>
      )}
    </div>
  );
}

function LogSection({ title, content, isError }: { title: string; content: string; isError?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${isError ? 'text-red-600' : 'text-gray-500'}`}>{title}</p>
        <button onClick={copy} className="text-xs text-gray-400 hover:text-gray-600">
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className={`text-xs rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap break-words font-mono ${isError ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-700'}`}>
        {content}
      </pre>
    </div>
  );
}
