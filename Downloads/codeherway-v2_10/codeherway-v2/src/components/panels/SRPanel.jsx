// ═══════════════════════════════════════════════
// SR PANEL — Spaced repetition review queue
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';

export function SRPanel({ isOpen, onClose }) {
  const { getDueSRCards, updateSRCard, srQueue } = useProgress();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [sessionRight, setSessionRight] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  if (!isOpen) return null;

  const due = getDueSRCards();

  const handleAnswer = (optIdx) => {
    if (answered !== null) return;
    setAnswered(optIdx);
    const card = due[currentIdx];
    const correct = optIdx === card.correct;
    updateSRCard(card.question, correct);
    if (correct) setSessionRight((s) => s + 1);
    else setSessionWrong((s) => s + 1);

    setTimeout(() => {
      setAnswered(null);
      setCurrentIdx((i) => i + 1);
    }, 1200);
  };

  const resetSession = () => {
    setCurrentIdx(0);
    setAnswered(null);
    setSessionRight(0);
    setSessionWrong(0);
  };

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>🔄 Review ({due.length} due)</h2>
          <button className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cheatsheet-body">
          {due.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon">🎉</span>
              <p><strong>All caught up!</strong></p>
              <p className="empty-state-msg">
                {srQueue.length > 0
                  ? `${srQueue.length} card${srQueue.length > 1 ? 's' : ''} scheduled for later.`
                  : 'Complete quizzes to add cards. Wrong answers get added automatically!'}
              </p>
            </div>
          ) : currentIdx >= due.length ? (
            <>
              <div className="sr-empty">
                <span className="sr-empty-icon">✅</span>
                <p><strong>Session complete!</strong></p>
              </div>
              <div className="sr-score-bar">
                <span>Results:</span>
                <span className="sr-right-count">✓ {sessionRight}</span>
                <span className="sr-wrong-count">✕ {sessionWrong}</span>
              </div>
              <button className="quiz-retry retry-btn-mt" onClick={resetSession}>↻ Review Again</button>
            </>
          ) : (
            <>
              <div className="sr-card">
                <div className="sr-q">{due[currentIdx].question}</div>
                <div className="sr-from">{due[currentIdx].source}</div>
                {due[currentIdx].code && <code>{due[currentIdx].code}</code>}
                <div className="sr-opts">
                  {due[currentIdx].options.map((opt, oi) => {
                    let cls = 'sr-opt';
                    if (answered !== null) {
                      if (oi === due[currentIdx].correct) cls += ' correct';
                      if (oi === answered && oi !== due[currentIdx].correct) cls += ' wrong';
                    }
                    return (
                      <button key={oi} className={cls} onClick={() => handleAnswer(oi)}
                              disabled={answered !== null}>
                        <span className="sr-letter">{String.fromCharCode(65 + oi)}</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answered !== null && (
                  <div className={`sr-result ${answered === due[currentIdx].correct ? 'right' : 'wrong'}`}>
                    {answered === due[currentIdx].correct ? '✓' : '✕'} {due[currentIdx].explanation}
                  </div>
                )}
              </div>
              <p className="sr-progress-label">
                {currentIdx + 1} of {due.length}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
