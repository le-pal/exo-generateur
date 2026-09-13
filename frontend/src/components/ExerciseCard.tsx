import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { ExerciseView } from '../types/api.ts';

const MD_REMARK = [remarkMath];
const MD_REHYPE = [rehypeKatex];

function Md({ children, inline }: { children: string; inline?: boolean }) {
  if (inline) {
    return (
      <ReactMarkdown
        remarkPlugins={MD_REMARK}
        rehypePlugins={MD_REHYPE}
        components={{
          p: ({ children }) => <span>{children}</span>,
          code: ({ children }) => <code className="bg-gray-100 rounded px-1 text-sm font-mono">{children}</code>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
        }}
      >
        {children}
      </ReactMarkdown>
    );
  }
  return (
    <ReactMarkdown
      remarkPlugins={MD_REMARK}
      rehypePlugins={MD_REHYPE}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ children }) => <code className="bg-gray-100 rounded px-1 text-sm font-mono">{children}</code>,
        pre: ({ children }) => <pre className="bg-gray-100 rounded p-3 overflow-x-auto text-sm font-mono mb-2">{children}</pre>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 mb-2">{children}</blockquote>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

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

// ── One question (standalone, or a sub-question inside a group) ────────────────

interface QuestionBlockProps {
  exercise: ExerciseView;
  label: string;
  onAnswer: (exerciseId: number, value: string) => void;
  disabled: boolean;
  showCorrection: boolean;
  /** true = full card with colored border/header (standalone exercise); false = plain nested row (sub-question). */
  bordered: boolean;
}

function QuestionBlock({ exercise, label, onAnswer, disabled, showCorrection, bordered }: QuestionBlockProps) {
  const [answer, setAnswer] = useState<string>(exercise.answer?.student_answer ?? '');

  const handleChange = (val: string) => {
    setAnswer(val);
    onAnswer(exercise.id, val);
  };

  const isCorrect = exercise.answer?.is_correct;
  const correction = exercise.answer?.correction;
  const score = exercise.answer?.score;
  const isPartial = showCorrection && !isCorrect && score !== null && score !== undefined && score > 0;
  const earnedPoints = score !== null && score !== undefined ? score * exercise.points : null;

  const status = !showCorrection || !exercise.answer ? null : isCorrect ? 'correct' : isPartial ? 'partial' : 'incorrect';

  const headerBg = status === 'correct' ? 'bg-green-50' : status === 'partial' ? 'bg-amber-50' : status === 'incorrect' ? 'bg-red-50' : 'bg-gray-50';
  const borderColor = status === 'correct' ? 'border-green-300' : status === 'partial' ? 'border-amber-300' : status === 'incorrect' ? 'border-red-300' : 'border-gray-100';

  const header = (
    <div className={`flex items-center justify-between ${bordered ? `${headerBg} px-5 py-3` : 'mb-2'}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className={`badge ${typeStyle(exercise.type)}`}>{typeLabel(exercise.type)}</span>
        <span className="text-xs text-gray-400">
          {showCorrection && earnedPoints !== null ? `${formatPoints(earnedPoints)}/${exercise.points}` : exercise.points} pt{exercise.points > 1 ? 's' : ''}
        </span>
      </div>
      {showCorrection && exercise.answer && (
        <div className="flex items-center gap-1">
          {status === 'correct' && <span className="text-green-600 font-semibold text-sm">✓ Correct</span>}
          {status === 'partial' && <span className="text-amber-600 font-semibold text-sm">◐ Partiel</span>}
          {status === 'incorrect' && <span className="text-red-600 font-semibold text-sm">✗ Incorrect</span>}
        </div>
      )}
    </div>
  );

  const body = (
    <div className={bordered ? 'px-5 py-4 space-y-4' : 'space-y-3'}>
      {exercise.type === 'fill_blank' ? (
        <FillBlankInput question={exercise.question} value={answer} onChange={handleChange} disabled={disabled} />
      ) : (
        <div className="text-gray-800 leading-relaxed">
          <Md>{exercise.question}</Md>
        </div>
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
                  <Md inline>{opt}</Md>
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
          type="text"
          inputMode="decimal"
          className="input w-40"
          placeholder="Ex : 3 ou 1/5"
          value={answer}
          onChange={e => handleChange(e.target.value)}
          disabled={disabled}
        />
      )}

      {showCorrection && correction && (
        <div className={`rounded-lg p-4 text-sm leading-relaxed ${status === 'correct' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold mb-1">{status === 'correct' ? 'Explication' : 'Correction'}</p>
          <Md>{correction}</Md>
        </div>
      )}
    </div>
  );

  if (!bordered) return <div>{header}{body}</div>;

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm`}>
      {header}
      {body}
    </div>
  );
}

// ── Exercise card : standalone, or a chained group sharing one statement ───────

const GROUP_LETTERS = 'abcdefghij';

interface ExerciseCardProps {
  index: number;
  /** Shared statement for a chained group — null/undefined for a standalone exercise. */
  groupStatement?: string | null;
  /** The exercise (length 1) or all sub-questions of the group (length ≥ 2), in order. */
  exercises: ExerciseView[];
  onAnswer: (exerciseId: number, value: string) => void;
  disabled: boolean;
  showCorrection: boolean;
}

export default function ExerciseCard({ index, groupStatement, exercises, onAnswer, disabled, showCorrection }: ExerciseCardProps) {
  if (!groupStatement || exercises.length < 2) {
    return (
      <QuestionBlock
        exercise={exercises[0]!}
        label={`Exercice ${index + 1}`}
        onAnswer={onAnswer}
        disabled={disabled}
        showCorrection={showCorrection}
        bordered
      />
    );
  }

  const totalPoints = exercises.reduce((s, e) => s + e.points, 0);
  const earnedPoints = exercises.reduce((s, e) => s + (e.answer?.score ?? 0) * e.points, 0);
  const anyAnswered = exercises.some(e => e.answer);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exercice {index + 1}</span>
        <span className="text-xs text-gray-400">
          {showCorrection && anyAnswered ? `${formatPoints(earnedPoints)}/${formatPoints(totalPoints)}` : formatPoints(totalPoints)} pts
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 mb-4 text-gray-800 leading-relaxed">
          <Md>{groupStatement}</Md>
        </div>
        <div className="divide-y divide-gray-100">
          {exercises.map((ex, i) => (
            <div key={ex.id} className={i > 0 ? 'pt-4 mt-4' : ''}>
              <QuestionBlock
                exercise={ex}
                label={`${GROUP_LETTERS[i] ?? i + 1})`}
                onAnswer={onAnswer}
                disabled={disabled}
                showCorrection={showCorrection}
                bordered={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Points are always a multiple of 0.5 (score ∈ {0, 0.5, 1} × integer points) — show "1.5" but not "1.0". */
function formatPoints(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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
