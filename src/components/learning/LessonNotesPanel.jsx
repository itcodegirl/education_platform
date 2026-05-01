// ═══════════════════════════════════════════════
// LESSON NOTES PANEL — Debounced textarea that saves
// the learner's notes for the current lesson to the
// cloud (via ProgressContext.saveNote). Appears when
// the user clicks the ✎ button in LessonHeader.
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { useProgress } from '../../providers';

const SAVE_DEBOUNCE_MS = 800;

export function LessonNotesPanel({ lessonKey }) {
  const { saveNote, getNote } = useProgress();
  const [noteText, setNoteText] = useState(() => getNote(lessonKey));
  const saveTimer = useRef(null);
  const noteRef = useRef(noteText);
  const keyRef = useRef(lessonKey);

  noteRef.current = noteText;
  keyRef.current = lessonKey;

  // Re-seed when the user navigates to a different lesson.
  useEffect(() => {
    setNoteText(getNote(lessonKey));
  }, [lessonKey, getNote]);

  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      saveNote(keyRef.current, noteRef.current);
    }
  }, [saveNote]);

  const handleChange = (event) => {
    const value = event.target.value;
    setNoteText(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveNote(lessonKey, value);
    }, SAVE_DEBOUNCE_MS);
  };

  // Flush pending save on unmount or when lessonKey changes so we
  // never lose the last ~800ms of typing.
  useEffect(() => {
    return () => flushSave();
  }, [lessonKey, flushSave]);

  const savedText = getNote(lessonKey);
  const isDirty = noteText !== savedText;

  return (
    <div className="notes-panel">
      <div className="notes-head">
        <span className="notes-icon" aria-hidden="true">✎</span>
        <span>Your Notes</span>
        <span className="notes-saved" aria-live="polite" aria-atomic="true">
          {isDirty ? 'Saving...' : noteText ? '✓ Saved' : ''}
        </span>
      </div>
      <textarea
        className="notes-input"
        value={noteText}
        onChange={handleChange}
        placeholder="Type your notes for this lesson..."
        rows={4}
        aria-label="Lesson notes"
      />
    </div>
  );
}
