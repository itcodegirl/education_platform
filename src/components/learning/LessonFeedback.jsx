// ═══════════════════════════════════════════════
// LESSON FEEDBACK — Thumbs up/down per lesson
// Stores in localStorage (no backend needed)
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const STORAGE_KEY = 'chw-lesson-feedback';

export const LessonFeedback = memo(function LessonFeedback({ lessonKey }) {
  const [allFeedback, setAllFeedback] = useLocalStorage(STORAGE_KEY, {});
  const feedback = allFeedback?.[lessonKey] ?? null;

  const handleFeedback = (value) => {
    const next = feedback === value ? null : value;
    setAllFeedback((prev) => ({ ...(prev || {}), [lessonKey]: next }));
  };

  return (
    <div className="lesson-feedback">
      <div className="lesson-feedback-copy">
        <span className="lesson-feedback-label">Was this lesson helpful?</span>
        <span className="lesson-feedback-sub">A quick signal helps us keep the strongest lessons feeling sharp.</span>
      </div>
      <div className="lesson-feedback-btns">
        <button
          type="button"
          className={`lesson-feedback-btn ${feedback === 'up' ? 'active-up' : ''}`}
          onClick={() => handleFeedback('up')}
          aria-label="Thumbs up"
          aria-pressed={feedback === 'up'}
        >
          👍
        </button>
        <button
          type="button"
          className={`lesson-feedback-btn ${feedback === 'down' ? 'active-down' : ''}`}
          onClick={() => handleFeedback('down')}
          aria-label="Thumbs down"
          aria-pressed={feedback === 'down'}
        >
          👎
        </button>
      </div>
      {feedback && (
        <span className="lesson-feedback-thanks">
          {feedback === 'up' ? 'Thanks!' : 'We\'ll improve this.'}
        </span>
      )}
    </div>
  );
});
