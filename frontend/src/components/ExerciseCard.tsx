import { useState, useEffect } from 'react';
import type { ExerciseView } from '../types/api.ts';

// ── Fill blank ────────────────────────────────────────────────────────────────

interface FillBlankInputProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function FillBlankInput({ question, value, onChange, disabled }: FillBlankInputProps) {
  const parts = question.split('[BLANK]');
  const [values, setValues] = useState<string[]>(() => {
    if (value) return value.split(',').map(v => v.trim());
    return Array<string>(parts.length - 1).fill('');
  });

  useEffect(() => {
    onChange(values.join(', '));
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i: number, v: string) => {
    setValues(prev => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  return (
    <p className="text-gray-800 leading-relaxed">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              type="text"
              className="inline-block border-b-2 border-blue-400 bg-transparent mx-1 px-1 w-24 text-blue-700 focus:outline-none focus:border-blue-600"
              value={values[i] ?? ''}
              onChange={e => update(i, e.target.value)}
              disabled={disabled}
            />
          )}
        </span>
      ))}
    </p>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseView;
  index: number;
  onAnswer: (value: string) => void;
  disabled: boolean;
  showCorrection: boolean;
}

export default function ExerciseCard({ exercise, index, onAnswer, disabled, showCorrection }: ExerciseCardProps) {
  const [answer, setAnswer] = useState<string>(exercise.answer?.student_answer ?? '');

  const handleChange = (val: string) => {
    setAnswer(val);
    onAnswer(val);
  };

  const isCorrect = exercise.answer?.is_correct;
  const correction = exercise.answer?.correction;
  const score = exercise.answer?.score;

  const borderColor = showCorrection && exercise.answer
    ? isCorrect ? 'border-green-300' : 'border-red-300'
    : 'border-gray-100';

  const headerBg = showCorrection && exercise.answer
    ? isCorrect ? 'bg-green-50' : 'bg-red-50'
    : 'bg-gray-50';

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm`}>
      <div className={`${headerBg} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Exercice {index + 1}
          </span>
          <span className={`badge ${typeStyle(exercise.type)}`}>{typeLabel(exercise.type)}</span>
          <span className="text-xs text-gray-400">{exercise.points} pt{exercise.points > 1 ? 's' : ''}</span>
        </div>
        {showCorrection && exercise.answer && (
          <div className="flex items-center gap-1">
            {isCorrect
              ? <span className="text-green-600 font-semibold text-sm">✓ Correct</span>
              : <span className="text-red-600 font-semibold text-sm">✗ Incorrect</span>
            }
            {score !== null && score !== undefined && !isCorrect && score > 0 && (
              <span className="text-amber-600 text-xs">({Math.round(score * 100)}%)</span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {exercise.type === 'fill_blank' ? (
          <FillBlankInput question={exercise.question} value={answer} onChange={handleChange} disabled={disabled} />
        ) : (
          <p className="text-gray-800 leading-relaxed">{exercise.question}</p>
        )}

        {exercise.type === 'mcq' && (
          <div className="space-y-2">
            {(exercise.options ?? []).map((opt, i) => {
              const isSelected = answer === opt;
              const isRight = showCorrection && opt === exercise.correct_answer;
              const isWrong = showCorrection && isSelected && opt !== exercise.correct_answer;
              return (
                <label
                  key={i}
                  className={[
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isRight ? 'bg-green-50 border-green-300' : '',
                    isWrong ? 'bg-red-50 border-red-300' : '',
                    !isRight && !isWrong ? 'border-gray-200 hover:bg-gray-50' : '',
                    disabled ? 'cursor-default' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`ex-${exercise.id}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleChange(opt)}
                    disabled={disabled}
                    className="accent-blue-600"
                  />
                  <span className={`text-sm ${isRight ? 'text-green-700 font-medium' : isWrong ? 'text-red-700' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                  {isRight && <span className="ml-auto text-green-500 text-xs">✓ Bonne réponse</span>}
                </label>
              );
            })}
          </div>
        )}

        {exercise.type === 'text' && (
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Ta réponse…"
            value={answer}
            onChange={e => handleChange(e.target.value)}
            disabled={disabled}
          />
        )}

        {exercise.type === 'number' && (
          <input
            type="number"
            className="input w-40"
            placeholder="0"
            value={answer}
            onChange={e => handleChange(e.target.value)}
            disabled={disabled}
            step="any"
          />
        )}

        {showCorrection && correction && (
          <div className={`rounded-lg p-4 text-sm leading-relaxed ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            <p className="font-semibold mb-1">{isCorrect ? 'Explication' : 'Correction'}</p>
            <p>{correction}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = { mcq: 'QCM', text: 'Rédaction', number: 'Calcul', fill_blank: 'Compléter' };
  return map[type] ?? type;
}

function typeStyle(type: string): string {
  const map: Record<string, string> = {
    mcq: 'bg-purple-100 text-purple-700',
    text: 'bg-blue-100 text-blue-700',
    number: 'bg-orange-100 text-orange-700',
    fill_blank: 'bg-teal-100 text-teal-700',
  };
  return map[type] ?? 'bg-gray-100 text-gray-600';
}
