import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  getApiKeys, updateApiKey, testApiKey,
  getPrompts, updatePrompt,
  getSettings, updateSettings,
  getReferenceData,
  getOpenRouterModels,
  getLogs,
} from '../api/client.ts';
import type { Student, Prompt, ApiKeyInfo, LlmLogEntry, ModelDefinition } from '../types/api.ts';

const TABS = ['Élèves', 'Modèle & Clés API', 'Prompts', 'Logs'] as const;
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
      {tab === 'Logs' && <LogsTab />}
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
  { id: 'claude',      label: 'Claude (Anthropic)', placeholder: 'sk-ant-api03-…',       helpUrl: 'console.anthropic.com' },
  { id: 'gemini',      label: 'Gemini (Google)',     placeholder: 'AIza…',                helpUrl: 'aistudio.google.com' },
  { id: 'openrouter',  label: 'OpenRouter',          placeholder: 'sk-or-v1-…',           helpUrl: 'openrouter.ai/keys' },
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
  const [orModels, setOrModels] = useState<ModelDefinition[]>([]);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState('');

  const runTest = async (provider: string) => {
    setTestState(s => ({ ...s, [provider]: { status: 'testing' } }));
    try {
      const result = await testApiKey(provider);
      setTestState(s => ({
        ...s,
        [provider]: result.ok
          ? { status: 'ok' }
          : { status: 'error', error: result.error },
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
      void qc.invalidateQueries({ queryKey: ['reference'] });
      setKeyValues(v => ({ ...v, [provider]: '' }));
      void runTest(provider);
    },
    onError: (_err, { provider }) => {
      setTestState(s => ({ ...s, [provider]: { status: 'error', error: 'Erreur lors de la sauvegarde' } }));
    },
  });

  const modelMutation = useMutation({
    mutationFn: (model: string) => updateSettings({ default_model: model }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const debugMutation = useMutation({
    mutationFn: (val: boolean) => updateSettings({ debug_mode: val ? 'true' : 'false' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const loadOrModels = async () => {
    setOrLoading(true);
    setOrError('');
    try {
      const models = await getOpenRouterModels();
      setOrModels(models);
      void qc.invalidateQueries({ queryKey: ['reference'] });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setOrError(err.response?.data?.error ?? err.message ?? 'Erreur');
    } finally {
      setOrLoading(false);
    }
  };

  const allModels = ref?.models ?? [];
  const currentModel = settings?.['default_model'] ?? '';
  const debugMode = settings?.['debug_mode'] === 'true';

  const PROVIDER_GROUPS = [
    { id: 'claude', label: 'Claude (Anthropic)' },
    { id: 'gemini', label: 'Gemini (Google)' },
    { id: 'openrouter', label: 'OpenRouter' },
  ];

  return (
    <div className="space-y-4">
      {/* Default model picker */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Modèle par défaut</h2>
        {allModels.length === 0 ? (
          <p className="text-sm text-amber-600">Aucune clé API active — configurez une clé ci-dessous pour accéder aux modèles.</p>
        ) : (
          <div className="space-y-4">
            {PROVIDER_GROUPS.filter(pg => allModels.some(m => m.provider === pg.id)).map(pg => (
              <div key={pg.id}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{pg.label}</p>
                {pg.id === 'openrouter' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => void loadOrModels()}
                        disabled={orLoading}
                      >
                        {orLoading ? 'Chargement…' : 'Actualiser les modèles OpenRouter'}
                      </button>
                      {orModels.length > 0 && (
                        <span className="text-xs text-gray-400">{orModels.length} modèles disponibles</span>
                      )}
                    </div>
                    {orError && <p className="text-xs text-red-600 mb-2">{orError}</p>}
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {allModels.filter(m => m.provider === 'openrouter').map(m => {
                        const active = currentModel === m.id;
                        return (
                          <button key={m.id} onClick={() => modelMutation.mutate(m.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm border-b border-gray-100 last:border-0 transition-colors ${active ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}>
                            <span className="font-medium truncate mr-2">{m.label}</span>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{m.description}</span>
                            {active && <span className="ml-2 text-blue-600 font-bold flex-shrink-0">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {allModels.filter(m => m.provider === pg.id).map(m => {
                      const active = currentModel === m.id;
                      return (
                        <button key={m.id} onClick={() => modelMutation.mutate(m.id)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className={`font-medium text-sm ${active ? 'text-blue-800' : 'text-gray-800'}`}>{m.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{m.description}</div>
                          {active && <div className="text-xs text-blue-600 mt-1 font-semibold">✓ Sélectionné</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">Ce modèle sera utilisé pour toutes les générations.</p>
      </div>

      {/* API key inputs */}
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
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    {isSaving ? 'Sauvegarde…' : 'Test en cours…'}
                  </span>
                ) : 'Sauvegarder & tester'}
              </button>
            </div>

            {/* Extra action for OpenRouter: load models */}
            {p.id === 'openrouter' && keyRow?.is_set === 1 && (
              <div className="mt-2">
                <button
                  className="btn-secondary text-xs"
                  onClick={() => void loadOrModels()}
                  disabled={orLoading}
                >
                  {orLoading ? 'Chargement…' : 'Charger / rafraîchir les modèles disponibles'}
                </button>
                {orModels.length > 0 && (
                  <span className="ml-2 text-xs text-green-600">{orModels.length} modèles chargés</span>
                )}
                {orError && <p className="text-xs text-red-600 mt-1">{orError}</p>}
              </div>
            )}

            {ts.status === 'ok' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-base">✓</span>
                <span>Clé valide — connexion réussie</span>
              </div>
            )}
            {ts.status === 'error' && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="text-base flex-shrink-0">✗</span>
                <span><span className="font-medium">Clé invalide : </span>{ts.error}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Obtenez votre clé sur <span className="font-mono">{p.helpUrl}</span>
            </p>
          </div>
        );
      })}

      {/* Debug mode */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-1">Mode debug</h2>
        <p className="text-xs text-gray-500 mb-3">
          Quand activé, les trames complètes (prompt + réponse) sont enregistrées dans les logs.
          Utile pour le diagnostic mais augmente la taille des fichiers de log.
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={debugMode}
              onChange={e => debugMutation.mutate(e.target.checked)}
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${debugMode ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${debugMode ? 'translate-x-4' : ''}`} />
          </div>
          <span className={`text-sm font-medium ${debugMode ? 'text-blue-700' : 'text-gray-600'}`}>
            {debugMode ? 'Debug activé — trames complètes enregistrées' : 'Debug désactivé — logs résumés seulement'}
          </span>
        </label>
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

// ── Logs ──────────────────────────────────────────────────────────────────────

function LogsTab() {
  const [limit, setLimit] = useState(50);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: logs = [], isLoading, refetch } = useQuery<LlmLogEntry[]>({
    queryKey: ['logs', limit],
    queryFn: () => getLogs(limit),
    refetchInterval: false,
  });

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">Échanges LLM</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Les trames complètes (prompt/réponse) n'apparaissent qu'en mode debug.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="select text-xs"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              <option value={25}>25 derniers</option>
              <option value={50}>50 derniers</option>
              <option value={100}>100 derniers</option>
              <option value={200}>200 derniers</option>
            </select>
            <button className="btn-secondary text-xs" onClick={() => void refetch()} disabled={isLoading}>
              {isLoading ? 'Chargement…' : 'Rafraîchir'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Chargement…</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun échange enregistré pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <LogEntry key={i} log={log} index={i} expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogEntry({ log, expanded, onToggle }: { log: LlmLogEntry; index: number; expanded: boolean; onToggle: () => void }) {
  const hasDebugData = !!(log.prompt || log.response);
  const opColor = log.operation === 'generation' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  const providerColor: Record<string, string> = {
    claude: 'bg-orange-100 text-orange-700',
    gemini: 'bg-cyan-100 text-cyan-700',
    openrouter: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className={`rounded-lg border ${log.success ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
      <button
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 rounded-lg"
        onClick={onToggle}
      >
        <span className={`text-base flex-shrink-0 ${log.success ? 'text-green-500' : 'text-red-500'}`}>
          {log.success ? '✓' : '✗'}
        </span>
        <span className={`badge text-xs ${opColor}`}>{log.operation}</span>
        <span className={`badge text-xs ${providerColor[log.provider] ?? 'bg-gray-100 text-gray-600'}`}>{log.provider}</span>
        <span className="text-xs text-gray-600 font-mono truncate flex-1">{log.model}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{log.duration_ms}ms</span>
        <span className="text-xs text-gray-300 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
        {hasDebugData && (
          <span className="text-xs badge bg-yellow-100 text-yellow-700 flex-shrink-0">debug</span>
        )}
        <span className="text-gray-400 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div><span className="text-gray-400">Date :</span> {new Date(log.timestamp).toLocaleString('fr-FR')}</div>
            <div><span className="text-gray-400">Prompt :</span> {log.prompt_length.toLocaleString()} car.</div>
            <div><span className="text-gray-400">Réponse :</span> {log.response_length.toLocaleString()} car.</div>
          </div>

          {log.error && (
            <div className="text-xs text-red-700 bg-red-100 rounded p-2 font-mono break-all">{log.error}</div>
          )}

          {log.prompt && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">Prompt complet ({log.prompt_length.toLocaleString()} car.)</summary>
              <pre className="mt-2 bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs whitespace-pre-wrap">{log.prompt}</pre>
            </details>
          )}

          {log.response && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">Réponse complète ({log.response_length.toLocaleString()} car.)</summary>
              <pre className="mt-2 bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs whitespace-pre-wrap">{log.response}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
