// ═══════════════════════════════════════════════
// QUIZ VIEW — Multi-type quiz engine
//
// Types:
//   mc    — Multiple choice (pick one)
//   code  — "What does this output?" with code block
//   bug   — "Find the bug" — pick the line with the error
//   fill  — Fill in the blank (text input, checked loosely)
//   order — Drag/click to reorder items
//
// All types resolve to correct/incorrect for scoring + SR
// ═══════════════════════════════════════════════

import { useState, useCallback, memo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { XP_VALUES, TIMING } from '../../utils/helpers';

// ─── Check if answer is correct per type ────
function isAnswerCorrect(q, answer) {
  if (answer === undefined || answer === null) return false;

  switch (q.type) {
    case 'mc':
    case 'code':
    case 'bug':
      return answer === q.correct;

    case 'fill': {
      if (!answer) return false;
      const student = answer.toString().trim().toLowerCase().replace(/['"`;{}()]/g, '');
      const accepts = Array.isArray(q.correct) ? q.correct : [q.correct];
      return accepts.some(a => student === a.toString().trim().toLowerCase().replace(/['"`;{}()]/g, ''));
    }

    case 'order':
      if (!Array.isArray(answer)) return false;
      return JSON.stringify(answer) === JSON.stringify(q.correct);

    default:
      return answer === q.correct;
  }
}

// ─── Per-question renderers ─────────────────

function MCQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">{q.question}</p>
      {q.code && <pre className="qq-code"><code>{q.code}</code></pre>}
      <div className="qq-opts" role="radiogroup" aria-label={q.question}>
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}
              role="radio" aria-checked={answer === oi} aria-label={`Option ${String.fromCharCode(65 + oi)}: ${opt}`}>
              <span className="qq-opt-letter" aria-hidden="true">{String.fromCharCode(65 + oi)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CodeQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">What does this code output?</p>
      <pre className="qq-code"><code>{q.code}</code></pre>
      <div className="qq-opts" role="radiogroup" aria-label="What does this code output?">
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}
              role="radio" aria-checked={answer === oi} aria-label={`Option ${String.fromCharCode(65 + oi)}: ${opt}`}>
              <span className="qq-opt-letter" aria-hidden="true">{String.fromCharCode(65 + oi)}</span>
              <code className="qq-opt-code">{opt}</code>
            </button>
          );
        })}
      </div>
    </>
  );
}

function BugQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">{q.question || 'Which line has the bug?'}</p>
      <div className="qq-bug-lines">
        {q.lines.map((line, li) => {
          let cls = 'qq-bug-line';
          if (answer === li) cls += ' picked';
          if (submitted && li === q.correct) cls += ' is-correct';
          if (submitted && answer === li && !isCorrect) cls += ' is-wrong';
          return (
            <button key={li} type="button" className={cls} onClick={() => onAnswer(li)} disabled={submitted}>
              <span className="qq-line-num">{li + 1}</span>
              <code>{line}</code>
            </button>
          );
        })}
      </div>
    </>
  );
}

function FillQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">{q.question}</p>
      {q.code && <pre className="qq-code"><code>{q.code}</code></pre>}
      <div className="qq-fill-wrap">
        <input
          className={`qq-fill-input ${submitted ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer..."
          autoComplete="off"
          spellCheck={false}
          aria-label="Your answer"
        />
        {submitted && !isCorrect && (
          <div className="qq-fill-answer">
            Answer: <code>{Array.isArray(q.correct) ? q.correct[0] : q.correct}</code>
          </div>
        )}
      </div>
    </>
  );
}

function OrderQuestion({ q, answer, onAnswer, submitted }) {
  const items = answer || q.items.map((_, i) => i);
  const isCorrect = isAnswerCorrect(q, answer);

  const moveUp = (idx) => {
    if (submitted || idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onAnswer(next);
  };

  const moveDown = (idx) => {
    if (submitted || idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onAnswer(next);
  };

  return (
    <>
      <p className="qq-text">{q.question || 'Put these in the correct order:'}</p>
      <div className="qq-order-list">
        {items.map((itemIdx, pos) => {
          let cls = 'qq-order-item';
          if (submitted) {
            cls += q.correct[pos] === itemIdx ? ' is-correct' : ' is-wrong';
          }
          return (
            <div key={itemIdx} className={cls}>
              <span className="qq-order-num">{pos + 1}</span>
              <span className="qq-order-text">{q.items[itemIdx]}</span>
              {!submitted && (
                <span className="qq-order-btns">
                  <button type="button" className="qq-order-btn" onClick={() => moveUp(pos)} disabled={pos === 0} aria-label={`Move ${q.items[itemIdx]} up`}>↑</button>
                  <button type="button" className="qq-order-btn" onClick={() => moveDown(pos)} disabled={pos === items.length - 1} aria-label={`Move ${q.items[itemIdx]} down`}>↓</button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {submitted && !isCorrect && (
        <div className="qq-order-answer">
          Correct order: {q.correct.map(i => q.items[i]).join(' → ')}
        </div>
      )}
    </>
  );
}

// ─── Type label badges ──────────────────────
const TYPE_LABELS = {
  mc: null, // default, no badge needed
  code: '💻 Output',
  bug: '🐛 Find the Bug',
  fill: '✏️ Fill In',
  order: '🔢 Order',
};

// ─── Main QuizView ──────────────────────────

export const QuizView = memo(function QuizView({ quiz, accent, label, quizKey, onNext }) {
  const {
    awardXP, recordDailyActivity, saveQuizScore, addToSRQueue,
  } = useProgress();

  const [answers, setAnswers] = useState(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const setAnswer = (qId, value) => {
    if (submitted) return;
    setAnswers((p) => { const n = new Map(p); n.set(qId, value); return n; });
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);

    const score = quiz.questions.reduce(
      (s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0), 0
    );
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);

    if (quizKey) {
      saveQuizScore(quizKey, `${score}/${total}`);
    }

    if (pct === 100) {
      awardXP(XP_VALUES.perfectQuiz, 'Perfect quiz score!');
    } else {
      awardXP(XP_VALUES.quiz, 'Quiz completed');
    }
    recordDailyActivity();

    // Add wrong answers to spaced repetition (MC/code/bug only — fill/order don't translate well to SR)
    const wrongCards = quiz.questions
      .filter((q) => !isAnswerCorrect(q, answers.get(q.id)) && (q.type === 'mc' || q.type === 'code' || q.type === 'bug'))
      .map((q) => ({
        question: q.question || (q.type === 'code' ? 'What does this code output?' : 'Find the bug'),
        code: q.code || (q.lines ? q.lines.join('\n') : ''),
        options: q.options || q.lines || [],
        correct: q.correct,
        explanation: q.explanation,
        source: label,
        added: Date.now(),
        nextReview: Date.now() + TIMING.dayMs,
        interval: 1,
        ease: 2.5,
      }));

    if (wrongCards.length > 0) {
      addToSRQueue(wrongCards);
    }
  }, [quiz, answers, quizKey, label, awardXP, recordDailyActivity, saveQuizScore, addToSRQueue]);

  const reset = () => { setAnswers(new Map()); setSubmitted(false); };

  const score = quiz.questions.reduce((s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0), 0);
  const total = quiz.questions.length;
  const allAnswered = answers.size === total;
  const pct = Math.round((score / total) * 100);
  const wrongCount = submitted ? total - score : 0;

  return (
    <section className="quiz-container" aria-label={label}>
      <button
        type="button"
        className="quiz-header quiz-toggle"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="quiz-icon" aria-hidden="true">📝</span>
        <div>
          <h3 className="quiz-title">{label}</h3>
          <span className="quiz-count">{total} question{total > 1 ? 's' : ''}</span>
        </div>
        <span className="quiz-arrow" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && <><div className="quiz-questions">
        {quiz.questions.map((q, qi) => {
          const answer = answers.get(q.id);
          const correct = isAnswerCorrect(q, answer);
          const typeBadge = TYPE_LABELS[q.type];

          return (
            <div key={q.id} className={`qq ${submitted ? (correct ? 'correct' : 'wrong') : ''}`}>
              <div className="qq-num">{qi + 1}</div>
              <div className="qq-body">
                {typeBadge && <span className="qq-type-badge">{typeBadge}</span>}

                {(q.type === 'mc' || !q.type) && (
                  <MCQuestion q={q} answer={answer} onAnswer={(v) => setAnswer(q.id, v)} submitted={submitted} />
                )}
                {q.type === 'code' && (
                  <CodeQuestion q={q} answer={answer} onAnswer={(v) => setAnswer(q.id, v)} submitted={submitted} />
                )}
                {q.type === 'bug' && (
                  <BugQuestion q={q} answer={answer} onAnswer={(v) => setAnswer(q.id, v)} submitted={submitted} />
                )}
                {q.type === 'fill' && (
                  <FillQuestion q={q} answer={answer} onAnswer={(v) => setAnswer(q.id, v)} submitted={submitted} />
                )}
                {q.type === 'order' && (
                  <OrderQuestion q={q} answer={answer} onAnswer={(v) => setAnswer(q.id, v)} submitted={submitted} />
                )}

                {submitted && q.explanation && (
                  <div className={`qq-explain ${correct ? 'right' : 'wrong'}`}>
                    <span className="qq-explain-icon">{correct ? '✓' : '✕'}</span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button type="button" className="quiz-submit" style={{ background: allAnswered ? accent : undefined }}
                disabled={!allAnswered} onClick={handleSubmit}>
          {allAnswered ? 'Submit Answers' : `Answer all ${total} to submit`}
        </button>
      ) : (
        <div className="quiz-results">
          <div className="quiz-score" style={{ borderColor: accent }}>
            <div className="quiz-score-num" style={{ color: accent }}>{score}/{total}</div>
            <div className="quiz-score-pct">
              {pct}%{pct === 100 ? ' — Perfect! 🎉' : pct >= 70 ? ' — Nice! 💪' : ' — Keep learning! 📚'}
            </div>
          </div>
          <div className="quiz-meta">
            {pct === 100 && <span className="quiz-xp-badge perfect">+{XP_VALUES.perfectQuiz} XP</span>}
            {pct < 100 && <span className="quiz-xp-badge">+{XP_VALUES.quiz} XP</span>}
            {wrongCount > 0 && (
              <span className="quiz-sr-badge">🔄 {wrongCount} added to review</span>
            )}
          </div>
          <button type="button" className="quiz-retry" onClick={reset}>↻ Retry</button>
          {onNext && pct === 100 && (
            <button type="button" className="quiz-submit" style={{ background: accent, marginTop: 12 }} onClick={onNext}>
              Continue to next lesson →
            </button>
          )}
        </div>
      )}
      </>}
    </section>
  );
});
