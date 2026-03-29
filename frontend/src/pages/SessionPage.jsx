import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession, saveAnswer, correctSession } from '../api/client.js';
import ExerciseCard from '../components/ExerciseCard.jsx';

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const saveTimers = useRef({});
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState('');

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
    refetchOnWindowFocus: false,
  });

  // Debounced auto-save per exercise
  const handleAnswer = useCallback((exerciseId, value) => {
    clearTimeout(saveTimers.current[exerciseId]);
    saveTimers.current[exerciseId] = setTimeout(() => {
      saveAnswer(id, exerciseId, value).catch(console.error);
    }, 800);
  }, [id]);

  const correctMutation = useMutation({
    mutationFn: () => correctSession(id),
    onSuccess: (data) => {
      qc.setQueryData(['session', id], data);
      setCorrecting(false);
    },
    onError: (err) => {
      setCorrectionError(err.response?.data?.error || 'Erreur lors de la correction');
      setCorrecting(false);
    },
  });

  const handleCorrect = () => {
    setCorrectionError('');
    setCorrecting(true);
    correctMutation.mutate();
  };

  if (isLoading) return <LoadingState />;
  if (isError || !session) return <div className="text-red-600">Session introuvable</div>;

  const isCorrected = session.status === 'corrected';
  const exercises = session.exercises || [];

  // Score summary
  const corrected = exercises.filter(e => e.answer?.is_correct !== null && e.answer?.is_correct !== undefined);
  const correct = corrected.filter(e => e.answer?.is_correct);
  const totalPoints = exercises.reduce((s, e) => s + (e.points || 1), 0);
  const earnedPoints = correct.reduce((s, e) => s + (e.points || 1), 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Session header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">
          ← Retour
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session.subject} — {session.topic}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${difficultyStyle(session.difficulty)}`}>{session.difficulty}</span>
              <span className="badge bg-gray-100 text-gray-600">{exercises.length} exercice{exercises.length > 1 ? 's' : ''}</span>
              <span className={`badge ${statusStyle(session.status)}`}>{statusLabel(session.status)}</span>
            </div>
          </div>

          {isCorrected && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{earnedPoints}/{totalPoints}</div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          )}
        </div>

        {isCorrected && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">
                  {correct.length}/{exercises.length} bonnes réponses
                </p>
                <p className="text-sm text-blue-700 mt-0.5">
                  {earnedPoints >= totalPoints * 0.8
                    ? 'Excellent travail !'
                    : earnedPoints >= totalPoints * 0.5
                    ? 'Bon travail, continue !'
                    : 'Continue de t\'entraîner !'}
                </p>
              </div>
              <div className="w-16 h-16 relative">
                <CircleProgress value={earnedPoints} max={totalPoints} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            index={i}
            onAnswer={(val) => handleAnswer(ex.id, val)}
            disabled={isCorrected}
            showCorrection={isCorrected}
          />
        ))}
      </div>

      {/* Bottom action */}
      {!isCorrected && (
        <div className="mt-8 space-y-3">
          {correctionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {correctionError}
            </div>
          )}
          <button
            onClick={handleCorrect}
            disabled={correcting}
            className="btn-primary w-full py-3 text-base"
          >
            {correcting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Correction en cours…
              </span>
            ) : 'Valider et obtenir la correction'}
          </button>
          <p className="text-center text-xs text-gray-400">Tes réponses sont sauvegardées automatiquement</p>
        </div>
      )}

      {isCorrected && (
        <div className="mt-8 flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary">
            Nouvel exercice
          </button>
          <button onClick={() => navigate(`/history/${session.student_id}`)} className="btn-secondary">
            Voir l'historique
          </button>
        </div>
      )}
    </div>
  );
}

function CircleProgress({ value, max }) {
  const pct = max > 0 ? value / max : 0;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#dbeafe" strokeWidth="6" />
      <circle cx="30" cy="30" r={r} fill="none" stroke="#2563eb" strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="30" y="35" textAnchor="middle" className="fill-blue-700 text-xs font-bold rotate-90 origin-center"
        style={{ fontSize: 12, transform: 'rotate(90deg)', transformOrigin: '30px 30px', fill: '#1d4ed8' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function LoadingState() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

function difficultyStyle(d) {
  return { facile: 'bg-green-100 text-green-700', normal: 'bg-blue-100 text-blue-700', difficile: 'bg-red-100 text-red-700' }[d] || 'bg-gray-100 text-gray-600';
}
function statusStyle(s) {
  return { in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-gray-100 text-gray-600', corrected: 'bg-green-100 text-green-700' }[s] || '';
}
function statusLabel(s) {
  return { in_progress: 'En cours', completed: 'Terminé', corrected: 'Corrigé' }[s] || s;
}
