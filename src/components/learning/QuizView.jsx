// ═══════════════════════════════════════════════
// QuizView — orchestrates a single quiz attempt.
//
// All scoring + reward emission lives in
// useQuizSession; per-question rendering lives in
// quiz/questionTypes (QUESTION_RENDERERS registry).
// This file is just the layout + the score panel.
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { useQuizSession } from '../../hooks/useQuizSession';
import {
  QUESTION_RENDERERS,
  QUESTION_TYPE_LABELS,
  isAnswerCorrect,
} from './quiz/questionTypes';
import { renderMarkdown } from '../../utils/markdown';
import { getQuizResultFeedback } from '../../utils/quizFeedback';

export const QuizView = memo(function QuizView({ quiz, accent, label, quizKey, legacyQuizKeys = [] }) {
  const session = useQuizSession({ quiz, label, quizKey, legacyQuizKeys });
  const {
    answers,
    submitted,
    lastEarnedXp,
    setAnswer,
    handleSubmit,
    reset,
    score,
    total,
    allAnswered,
    pct,
    wrongCount,
  } = session;
  const resultFeedback = submitted
    ? getQuizResultFeedback({ pct, wrongCount, total })
    : null;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-icon" aria-hidden="true">📝</span>
        <div>
          <h3 className="quiz-title">{label}</h3>
          <span className="quiz-count">{total} question{total > 1 ? 's' : ''}</span>
        </div>
      </div>
      <p className="quiz-trust-copy">
        Quiz results save separately from lesson completion and are meant as confidence checks.
      </p>

      <div className="quiz-questions">
        {quiz.questions.map((q, qi) => {
          const answer = answers.get(q.id);
          const correct = isAnswerCorrect(q, answer);
          const typeBadge = QUESTION_TYPE_LABELS[q.type];
          // Older quiz items omit `type` and default to multiple choice.
          const Renderer = QUESTION_RENDERERS[q.type] || QUESTION_RENDERERS.mc;

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

                <Renderer
                  q={q}
                  answer={answer}
                  onAnswer={(v) => setAnswer(q.id, v)}
                  submitted={submitted}
                />

                {submitted && q.explanation && (
                  <div className={`qq-explain ${correct ? 'right' : 'wrong'}`}>
                    <span className="qq-explain-icon" aria-label={correct ? 'Correct' : 'Incorrect'}>{correct ? '✓' : '✕'}</span>
                    <div className="qq-explain-body">{renderMarkdown(q.explanation)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          className="quiz-submit"
          style={{ background: allAnswered ? accent : undefined }}
          disabled={!allAnswered}
          onClick={handleSubmit}
        >
          {allAnswered ? 'Submit Answers' : `Answer all ${total} to submit`}
        </button>
      ) : (
        <div className="quiz-results" role="status" aria-live="polite">
          <div className="quiz-score" style={{ borderColor: accent }}>
            <div className="quiz-score-num" style={{ color: accent }}>{score}/{total}</div>
            <div className="quiz-score-pct">
              {pct}%{pct === 100 ? ' — full marks' : pct >= 70 ? ' — solid round' : ' — worth another loop'}
            </div>
          </div>
          <div className="quiz-result-body">
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
            {resultFeedback && (
              <div className="quiz-feedback-loop">
                <p className="quiz-feedback-label">Feedback loop: {resultFeedback.label}</p>
                <p className="quiz-feedback-meaning">{resultFeedback.meaning}</p>
                <ul className="quiz-feedback-actions">
                  {resultFeedback.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="quiz-next-step" role="status" aria-live="polite">
            This score is a quick confidence check, not a final grade. Review the explanations,
            then retry for practice or continue to the next lesson. XP is awarded once per quiz milestone.
            </p>
          </div>
          <button type="button" className="quiz-retry" onClick={reset}>Retry for practice</button>
        </div>
      )}
    </div>
  );
});
