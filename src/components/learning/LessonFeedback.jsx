// ═══════════════════════════════════════════════
// LESSON FEEDBACK — Thumbs up/down per lesson
// Stores in localStorage (no backend needed)
// ═══════════════════════════════════════════════

import { useState, memo } from 'react';

const STORAGE_KEY = 'chw-lesson-feedback';

function getFeedback(lessonKey) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[lessonKey] || null;
  } catch { return null; }
}

function saveFeedback(lessonKey, value) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[lessonKey] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* non-critical */ }
}

export const LessonFeedback = memo(function LessonFeedback({ lessonKey }) {
  const [feedback, setFeedback] = useState(() => getFeedback(lessonKey));

  const handleFeedback = (value) => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    saveFeedback(lessonKey, next);
  };

  return (
    <div className="lesson-feedback">
      <span className="lesson-feedback-label">Was this lesson helpful?</span>
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
