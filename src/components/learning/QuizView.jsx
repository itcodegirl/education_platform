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
import { useAuth, useProgressData, useXP, useSR } from '../../providers';
import { TIMING } from '../../utils/helpers';
import {
  REWARD_XP,
  formatQuizScore,
  isQuizScoreImprovement,
  rewardKeys,
} from '../../services/rewardPolicy';
import { isBackendRewardSyncEnabled } from '../../services/rewardEventService';
import { REWARD_EVENT_TYPES } from '../../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../../engine/rewards/rewardEvents';
import { awardRewardOnce } from '../../engine/rewards/rewardRuntime';

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
      <div className="qq-opts">
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}>
              <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
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
      <div className="qq-opts">
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}>
              <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
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
  const promptId = `qq-fill-prompt-${q.id}`;
  return (
    <>
      <p id={promptId} className="qq-text">{q.question}</p>
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
          aria-label={`Answer for: ${q.question}`}
          aria-describedby={promptId}
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
                  <button
                    type="button"
                    className="qq-order-btn"
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    aria-label={`Move item ${pos + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="qq-order-btn"
                    onClick={() => moveDown(pos)}
                    disabled={pos === items.length - 1}
                    aria-label={`Move item ${pos + 1} down`}
                  >
                    ↓
                  </button>
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

export const QuizView = memo(function QuizView({ quiz, accent, label, quizKey }) {
  const { user } = useAuth();
  const {
    saveQuizScore,
    quizScores = {},
    hasRewardBeenAwarded = () => false,
    markRewardAwarded = () => false,
    markSyncFailed = () => {},
  } = useProgressData();
  const { awardXP, recordDailyActivity } = useXP();
  const { addToSRQueue } = useSR();

  const [answers, setAnswers] = useState(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);
  const backendRewardSyncEnabled = Boolean(user?.id) && isBackendRewardSyncEnabled();

  const setAnswer = (qId, value) => {
    if (submitted) return;
    setAnswers((p) => { const n = new Map(p); n.set(qId, value); return n; });
  };

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);

    const score = quiz.questions.reduce(
      (s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0), 0
    );
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);

    if (quizKey && isQuizScoreImprovement(quizScores[quizKey], score, total)) {
      saveQuizScore(quizKey, formatQuizScore(score, total));
    }

    let earnedXp = 0;

    if (quizKey) {
      const completionRewardKey = rewardKeys.quizComplete(quizKey);
      const completionResult = await awardRewardOnce({
        learnerKey: user?.id || '',
        event: createRewardEvent({
          type: REWARD_EVENT_TYPES.QUIZ_BASE,
          targetId: quizKey,
          learnerKey: user?.id || 'legacy-local',
          metadata: { rewardKey: completionRewardKey, score, total, pct },
        }),
        legacyRewardKey: completionRewardKey,
        hasRewardBeenAwarded,
        markRewardAwarded,
        awardXP,
        xpAmount: REWARD_XP.quizComplete,
        reason: 'Quiz completed',
        markSyncFailed,
        backendRewardSyncEnabled,
      });
      earnedXp += completionResult.rewardResult?.xpAwarded || 0;

      if (pct === 100) {
        const perfectRewardKey = rewardKeys.quizPerfect(quizKey);
        const perfectResult = await awardRewardOnce({
          learnerKey: user?.id || '',
          event: createRewardEvent({
            type: REWARD_EVENT_TYPES.QUIZ_PERFECT,
            targetId: quizKey,
            learnerKey: user?.id || 'legacy-local',
            metadata: { rewardKey: perfectRewardKey, score, total, pct },
          }),
          legacyRewardKey: perfectRewardKey,
          hasRewardBeenAwarded,
          markRewardAwarded,
          awardXP,
          xpAmount: REWARD_XP.quizPerfect,
          reason: 'Perfect quiz score!',
          markSyncFailed,
          backendRewardSyncEnabled,
        });
        earnedXp += perfectResult.rewardResult?.xpAwarded || 0;
      }
    } else {
      const xpAmount = pct === 100 ? REWARD_XP.quizPerfect : REWARD_XP.quizComplete;
      awardXP(xpAmount, pct === 100 ? 'Perfect quiz score!' : 'Quiz completed');
      earnedXp = xpAmount;
    }

    setLastEarnedXp(earnedXp);
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
  }, [
    quiz,
    answers,
    quizKey,
    label,
    user?.id,
    quizScores,
    hasRewardBeenAwarded,
    markRewardAwarded,
    markSyncFailed,
    backendRewardSyncEnabled,
    awardXP,
    recordDailyActivity,
    saveQuizScore,
    addToSRQueue,
  ]);

  const reset = () => { setAnswers(new Map()); setSubmitted(false); setLastEarnedXp(0); };

  const score = quiz.questions.reduce((s, q) => s + (isAnswerCorrect(q, answers.get(q.id)) ? 1 : 0), 0);
  const total = quiz.questions.length;
  const allAnswered = answers.size === total;
  const pct = Math.round((score / total) * 100);
  const wrongCount = submitted ? total - score : 0;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-icon" aria-hidden="true">📝</span>
        <div>
          <h3 className="quiz-title">{label}</h3>
          <span className="quiz-count">{total} question{total > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="quiz-questions">
        {quiz.questions.map((q, qi) => {
          const answer = answers.get(q.id);
          const correct = isAnswerCorrect(q, answer);
          const typeBadge = TYPE_LABELS[q.type];

          return (
            <div
              key={q.id}
              className={`qq ${submitted ? (correct ? 'correct' : 'wrong') : ''}`}
              role="group"
              aria-label={`Question ${qi + 1} of ${total}`}
            >
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
                    <span className="qq-explain-icon" aria-label={correct ? 'Correct' : 'Incorrect'}>{correct ? '✓' : '✕'}</span>
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
        <div className="quiz-results" role="status" aria-live="polite">
          <div className="quiz-score" style={{ borderColor: accent }}>
            <div className="quiz-score-num" style={{ color: accent }}>{score}/{total}</div>
            <div className="quiz-score-pct">
              {pct}%{pct === 100 ? ' — Perfect! 🎉' : pct >= 70 ? ' — Nice! 💪' : ' — Keep learning! 📚'}
            </div>
          </div>
          <div className="quiz-meta">
            {lastEarnedXp > 0 && (
              <span className={`quiz-xp-badge ${pct === 100 ? 'perfect' : ''}`}>+{lastEarnedXp} XP</span>
            )}
            {lastEarnedXp === 0 && quizKey && (
              <span className="quiz-xp-badge">XP already earned</span>
            )}
            {quizKey && <span className="quiz-save-badge">✓ Best score saved to your progress</span>}
            {wrongCount > 0 && (
              <span className="quiz-sr-badge">🔄 {wrongCount} added to review</span>
            )}
          </div>
          <p className="quiz-next-step" role="status" aria-live="polite">
            Next step: review the explanations below, then retry or continue to the next lesson.
          </p>
          <button type="button" className="quiz-retry" onClick={reset}>? Retry</button>
        </div>
      )}
    </div>
  );
});

