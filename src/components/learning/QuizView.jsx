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

export const QuizView = memo(function QuizView({ quiz, accent, label, quizKey }) {
  const session = useQuizSession({ quiz, label, quizKey });
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
                    <span>{q.explanation}</span>
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
