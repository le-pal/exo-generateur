import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudent, getStudentSessions } from '../api/client.ts';
import type { StudentSessionSummary } from '../types/api.ts';

export default function HistoryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data: student } = useQuery({ queryKey: ['student', studentId], queryFn: () => getStudent(Number(studentId)) });
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', studentId],
    queryFn: () => getStudentSessions(Number(studentId)),
  });

  if (isLoading) return <div className="text-gray-500">Chargement…</div>;

  const inProgress = sessions.filter(s => s.status === 'in_progress');
  const done = sessions.filter(s => s.status !== 'in_progress');

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => void navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">← Retour</button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student?.name}</h1>
          <p className="text-gray-500 text-sm">Niveau {student?.level} — {sessions.length} session{sessions.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/" className="btn-primary text-sm">+ Nouvel exercice</Link>
      </div>

      {sessions.length === 0 && (
        <div className="card text-center text-gray-500 py-12">
          <p className="text-lg mb-2">Aucun exercice pour l'instant</p>
          <Link to="/" className="btn-primary text-sm">Générer un premier exercice</Link>
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            En cours ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            Terminées ({done.length})
          </h2>
          <div className="space-y-3">
            {done.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: StudentSessionSummary }) {
  const navigate = useNavigate();
  const scorePercent = session.exercise_count > 0
    ? Math.round((session.correct_count / session.exercise_count) * 100)
    : null;

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => void navigate(`/session/${session.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{session.subject}</span>
            <span className={`badge ${difficultyStyle(session.difficulty)} flex-shrink-0`}>{session.difficulty}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">{session.topic}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(session.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="ml-4 text-right flex-shrink-0">
          {session.status === 'corrected' && scorePercent !== null ? (
            <div>
              <div className={`text-lg font-bold ${scorePercent >= 80 ? 'text-green-600' : scorePercent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {scorePercent}%
              </div>
              <div className="text-xs text-gray-400">{session.correct_count}/{session.exercise_count}</div>
            </div>
          ) : (
            <span className={`badge ${statusStyle(session.status)}`}>{statusLabel(session.status)}</span>
          )}
        </div>
      </div>
      {session.status === 'in_progress' && (
        <div className="mt-3"><span className="text-xs text-amber-600 font-medium">Reprendre →</span></div>
      )}
    </div>
  );
}

function difficultyStyle(d: string): string {
  return { facile: 'bg-green-100 text-green-700', normal: 'bg-blue-100 text-blue-700', difficile: 'bg-red-100 text-red-700' }[d] ?? '';
}
function statusStyle(s: string): string {
  return { in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-gray-100 text-gray-600', corrected: 'bg-green-100 text-green-700' }[s] ?? '';
}
function statusLabel(s: string): string {
  return { in_progress: 'En cours', completed: 'Terminé', corrected: 'Corrigé' }[s] ?? s;
}
