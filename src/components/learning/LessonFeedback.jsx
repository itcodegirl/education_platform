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
        <span className="lesson-feedback-label">How did this lesson feel?</span>
        <span className="lesson-feedback-sub">Your quick rating helps us improve unclear steps and keep great lessons strong.</span>
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
          {feedback === 'up' ? 'Thanks. We will keep building lessons like this.' : 'Thanks. We will tighten this lesson for the next revision.'}
        </span>
      )}
    </div>
  );
});
