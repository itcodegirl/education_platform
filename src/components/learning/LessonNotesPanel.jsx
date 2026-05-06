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
  const noteRef = useRef(noteText);

  // Keep the ref in sync inside an effect — writing it during render
  // breaks the react-hooks/refs rule and can be skipped if React
  // bails out of a render in concurrent mode.
  useEffect(() => {
    noteRef.current = noteText;
  }, [noteText]);

  // Re-seed when the user navigates to a different lesson.
  useEffect(() => {
    setNoteText(getNote(lessonKey));
  }, [lessonKey, getNote]);

  const handleChange = (event) => {
    const value = event.target.value;
    setNoteText(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveNote(lessonKey, value);
    }, SAVE_DEBOUNCE_MS);
  };

  // Flush pending save on unmount or when lessonKey changes.
  // `lessonKey` is captured by the closure — when the effect
  // re-runs because lessonKey changed A→B, the cleanup fires
  // with A (the value from the previous render's closure),
  // while noteRef.current gives the latest text. This avoids
  // the race where a ref-based key would already hold B.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        saveNote(lessonKey, noteRef.current);
      }
    };
  }, [lessonKey, saveNote]);

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
        <span className="notes-saved" aria-live="polite" aria-atomic="true">
          {isDirty ? 'Saving…' : noteText ? '✓ Saved' : ''}
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
