import { useState } from 'react';
import { useProgress } from '../../providers';

export function SRPanel({ isOpen, onClose }) {
  const { getDueSRCards, updateSRCard, srCards = [] } = useProgress();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [sessionRight, setSessionRight] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  if (!isOpen) return null;

  const queue = Array.isArray(srCards) ? srCards : [];
  const due = typeof getDueSRCards === 'function' ? (getDueSRCards() || []) : [];
  const currentCard = due[currentIdx] || null;

  const handleAnswer = (optIdx) => {
    if (answered !== null || !currentCard) return;

    setAnswered(optIdx);

    const correct = optIdx === currentCard.correct;
    updateSRCard(currentCard.question, correct);

    if (correct) setSessionRight((count) => count + 1);
    else setSessionWrong((count) => count + 1);

    setTimeout(() => {
      setAnswered(null);
      setCurrentIdx((idx) => idx + 1);
    }, 1200);
  };

  const resetSession = () => {
    setCurrentIdx(0);
    setAnswered(null);
    setSessionRight(0);
    setSessionWrong(0);
  };

  return (
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>Review ({due.length} due)</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>x</button>
        </div>

        <div className="cheatsheet-body">
          {due.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon">Done</span>
              <p><strong>All caught up!</strong></p>
              <p className="empty-state-msg">
                {queue.length > 0
                  ? `${queue.length} card${queue.length > 1 ? 's' : ''} scheduled for later.`
                  : 'Complete quizzes to add cards. Wrong answers get added automatically!'}
              </p>
            </div>
          ) : currentIdx >= due.length ? (
            <>
              <div className="sr-empty">
                <span className="sr-empty-icon">Done</span>
                <p><strong>Session complete!</strong></p>
              </div>

              <div className="sr-score-bar">
                <span>Results:</span>
                <span className="sr-right-count">Correct {sessionRight}</span>
                <span className="sr-wrong-count">Wrong {sessionWrong}</span>
              </div>

              <button type="button" className="quiz-retry retry-btn-mt" onClick={resetSession}>
                Review Again
              </button>
            </>
          ) : (
            <>
              <div className="sr-card">
                <div className="sr-q">{currentCard?.question}</div>
                <div className="sr-from">{currentCard?.source}</div>
                {currentCard?.code && <code>{currentCard.code}</code>}

                <div className="sr-opts">
                  {(currentCard?.options || []).map((option, optionIndex) => {
                    let className = 'sr-opt';

                    if (answered !== null) {
                      if (optionIndex === currentCard?.correct) className += ' correct';
                      if (optionIndex === answered && optionIndex !== currentCard?.correct) className += ' wrong';
                    }

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        className={className}
                        onClick={() => handleAnswer(optionIndex)}
                        disabled={answered !== null}
                      >
                        <span className="sr-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {answered !== null && (
                  <div className={`sr-result ${answered === currentCard?.correct ? 'right' : 'wrong'}`}>
                    {answered === currentCard?.correct ? 'Correct' : 'Incorrect'} {currentCard?.explanation}
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
