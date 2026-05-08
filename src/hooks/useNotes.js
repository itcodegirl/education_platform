// useNotes — owns the per-lesson note surface for the active
// learner. The note identity is the normalized lessonKey. Saves
// route through the per-resource serialization map so two debounce
// flushes for the same lesson land in submit order on the server.

import { useCallback, useState } from 'react';
import {
  getSavedNote,
  normalizeProgressLessonKey,
} from '../context/progressSavedLessonHelpers';

export function useNotes({ user, dbWrite, createProgressWrite }) {
  const [notes, setNotes] = useState({});

  const replaceNotes = useCallback((next) => {
    setNotes(next && typeof next === 'object' ? next : {});
  }, []);

  const resetNotes = useCallback(() => {
    setNotes({});
  }, []);

  const saveNote = useCallback(async (lessonKey, content) => {
    if (!user) return;
    const normalizedLessonKey = normalizeProgressLessonKey(lessonKey);
    setNotes((prev) => ({ ...prev, [normalizedLessonKey]: content }));
    // Note saves are debounced upstream but a fast typist can still
    // queue two saves for the same lesson; per-lesson serialization
    // means the latest text wins.
    dbWrite(
      createProgressWrite('saveNote', {
        lessonKey: normalizedLessonKey,
        content,
      }),
      'saveNote',
      { resourceKey: `note:${normalizedLessonKey}` },
    );
  }, [user, dbWrite, createProgressWrite]);

  const getNote = useCallback((lessonKey) => {
    const normalizedLessonKey = normalizeProgressLessonKey(lessonKey);
    return getSavedNote(notes, lessonKey, normalizedLessonKey);
  }, [notes]);

  return {
    notes,
    saveNote,
    getNote,
    replaceNotes,
    resetNotes,
  };
}
