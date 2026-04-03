// ═══════════════════════════════════════════════
// QUIZ VIEW — Interactive quiz with score, XP,
// SR queue integration, and score saving
// ═══════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useProgress } from '../context/ProgressContext';
import { XP_VALUES, TIMING } from '../utils/helpers';

export function QuizView({ quiz, accent, label, quizKey }) {
  const {
    awardXP, recordDailyActivity, saveQuizScore, addToSRQueue,
  } = useProgress();

  const [answers, setAnswers] = useState(new Map());
  const [submitted, setSubmitted] = useState(false);

  const pick = (qId, optIdx) => {
    if (submitted) return;
    setAnswers((p) => { const n = new Map(p); n.set(qId, optIdx); return n; });
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);

    const score = quiz.questions.reduce(
      (s, q) => s + (answers.get(q.id) === q.correct ? 1 : 0), 0
    );
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);

    // Save score to Supabase
    if (quizKey) {
      saveQuizScore(quizKey, `${score}/${total}`);
    }

    // Award XP
    if (pct === 100) {
      awardXP(XP_VALUES.perfectQuiz, 'Perfect quiz score!');
    } else {
      awardXP(XP_VALUES.quiz, 'Quiz completed');
    }
    recordDailyActivity();

    // Add wrong answers to spaced repetition queue
    const wrongCards = quiz.questions
      .filter((q) => answers.get(q.id) !== q.correct)
      .map((q) => ({
        question: q.question,
        code: q.code || '',
        options: q.options,
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

  const score = quiz.questions.reduce((s, q) => s + (answers.get(q.id) === q.correct ? 1 : 0), 0);
  const total = quiz.questions.length;
  const allAnswered = answers.size === total;
  const pct = Math.round((score / total) * 100);
  const wrongCount = submitted ? total - score : 0;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-icon">📝</span>
        <div>
          <h3 className="quiz-title">{label}</h3>
          <span className="quiz-count">{total} question{total > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="quiz-questions">
        {quiz.questions.map((q, qi) => {
          const picked = answers.get(q.id);
          const isCorrect = picked === q.correct;
          return (
            <div key={q.id} className={`qq ${submitted ? (isCorrect ? 'correct' : 'wrong') : ''}`}>
              <div className="qq-num">{qi + 1}</div>
              <div className="qq-body">
                <p className="qq-text">{q.question}</p>
                {q.code && <pre className="qq-code"><code>{q.code}</code></pre>}
                <div className="qq-opts">
                  {q.options.map((opt, oi) => {
                    let cls = 'qq-opt';
                    if (picked === oi) cls += ' picked';
                    if (submitted && oi === q.correct) cls += ' is-correct';
                    if (submitted && picked === oi && !isCorrect) cls += ' is-wrong';
                    return (
                      <button key={oi} className={cls} onClick={() => pick(q.id, oi)} disabled={submitted}>
                        <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`qq-explain ${isCorrect ? 'right' : 'wrong'}`}>
                    <span className="qq-explain-icon">{isCorrect ? '✓' : '✕'}</span>
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
          <button className="quiz-retry" onClick={reset}>↻ Retry</button>
        </div>
      )}
    </div>
  );
}
