// ═══════════════════════════════════════════════
// LESSON NOTES PANEL — Debounced textarea that saves
// the learner's notes for the current lesson to the
// account sync layer (via ProgressContext.saveNote). Appears when
// the user clicks the ✎ button in LessonHeader.
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useSR } from '../../providers';

const SAVE_DEBOUNCE_MS = 800;
const NOTE_MAX_CHARS = 2000;

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

  // On mobile the on-screen keyboard covers roughly half the viewport. The
  // notes panel often sits near the bottom of a long lesson, so without this
  // the field a learner just tapped ends up hidden behind the keyboard. Defer
  // the scroll so the visual viewport has resized first.
  const handleFocus = (event) => {
    const textarea = event.currentTarget;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    window.setTimeout(() => {
      textarea.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }, reduceMotion ? 0 : 250);
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
  const saveState = isDirty ? 'saving' : noteText ? 'saved' : 'idle';
  const saveLabel = isDirty ? 'Saving note...' : noteText ? 'Saved locally' : 'Ready';

  return (
    <div className="notes-panel">
      <div className="notes-head">
        <span className="notes-icon" aria-hidden="true">✎</span>
        <div className="notes-head-copy">
          <span className="notes-title">Lesson notes</span>
          <span className="notes-sub">
            Private notes save locally first, then cloud sync catches up when available.
          </span>
        </div>
        <span className={`notes-saved notes-saved-${saveState}`} aria-live="polite" aria-atomic="true">
          {saveLabel}
        </span>
      </div>
      {!noteText && (
        <p className="notes-empty">
          No note yet. Write the question, gotcha, or next step you want future-you to see first.
        </p>
      )}
      <textarea
        className="notes-input"
        value={noteText}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Summarize the pattern, write the gotcha, or leave yourself the next step to try."
        rows={4}
        maxLength={NOTE_MAX_CHARS}
        aria-label="Lesson notes"
        aria-describedby="lesson-notes-helper lesson-notes-count"
      />
      <div className="notes-foot">
        <span id="lesson-notes-helper">
          Saved in this browser first; queued cloud sync retries automatically.
        </span>
        <span id="lesson-notes-count" className="notes-count">
          {noteText.length}/{NOTE_MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
