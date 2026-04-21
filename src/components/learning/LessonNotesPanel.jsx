// ═══════════════════════════════════════════════
// LESSON NOTES PANEL — Debounced textarea that saves
// the learner's notes for the current lesson to the
// cloud (via ProgressContext.saveNote). Appears when
// the user clicks the ✎ button in LessonHeader.
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useSR } from '../../providers';

const SAVE_DEBOUNCE_MS = 800;

export function LessonNotesPanel({ lessonKey }) {
  const { saveNote, getNote } = useSR();
  const [noteText, setNoteText] = useState(() => getNote(lessonKey));
  const saveTimer = useRef(null);

  // Re-seed when the user navigates to a different lesson. Without
  // this, a fresh open of lesson B would still show lesson A's draft.
  useEffect(() => {
    setNoteText(getNote(lessonKey));
  }, [lessonKey, getNote]);

  const handleChange = (event) => {
    const value = event.target.value;
    setNoteText(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNote(lessonKey, value);
    }, SAVE_DEBOUNCE_MS);
  };

  // Flush any pending save on unmount (user navigating away) so we
  // don't lose the last ~800ms of typing.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  const savedText = getNote(lessonKey);
  const isDirty = noteText !== savedText;

  return (
    <div className="notes-panel">
      <div className="notes-head">
        <span className="notes-icon" aria-hidden="true">✎</span>
        <div className="notes-head-copy">
          <span className="notes-title">Your Notes</span>
          <span className="notes-sub">Capture the part you do not want to forget five minutes from now.</span>
        </div>
        <span className="notes-saved" aria-live="polite">
          {isDirty ? 'Saving...' : noteText ? '✓ Saved' : ''}
        </span>
      </div>
      <textarea
        className="notes-input"
        value={noteText}
        onChange={handleChange}
        placeholder="Summarize the pattern, write the gotcha, or leave yourself the next step to try."
        rows={4}
        aria-label="Lesson notes"
      />
    </div>
  );
}
