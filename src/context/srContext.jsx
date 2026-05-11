import { createContext, useCallback, useContext, useState } from 'react';
import { COURSES } from '../data';
import { lessonKeysEquivalent, resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';
import { createProgressWrite } from '../services/progressWriteQueue';
import { nextSRCardState } from '../services/srAlgorithm';

export const SRContext = createContext({
  srCards: [],
  addToSRQueue: () => {},
  updateSRCard: () => {},
  getDueSRCards: () => [],
  bookmarks: [],
  toggleBookmark: () => {},
  isBookmarked: () => false,
  notes: {},
  saveNote: () => {},
  getNote: () => '',
});

function normalizeLessonKey(lessonKey) {
  return resolveStableLessonKeyAcrossCourses(lessonKey, COURSES);
}

// Manages all SR, bookmark, and note state and callbacks.
// Called from ProgressProvider so the state participates in
// ProgressProvider's component lifecycle. Setters are exposed
// so the parent can populate state from the Supabase load effect
// and clear it on logout via resetUserState.
export function useSRSlice({ user, dbWrite }) {
  const [srCards, setSrCards] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});

  const addToSRQueue = useCallback(async (cards) => {
    if (!user) return;
    const existing = new Set(srCards.map(c => c.question));
    const newCards = cards.filter(c => !existing.has(c.question));

    setSrCards(prev => [...prev, ...newCards]);

    for (const card of newCards) {
      dbWrite(createProgressWrite('addSRCard', { card }), 'addSRCard');
    }
  }, [user, srCards, dbWrite]);

  const updateSRCard = useCallback(async (question, correct) => {
    if (!user) return;

    const currentCard = srCards.find((c) => c.question === question);
    if (!currentCard) return;

    const { interval, ease, nextReview } = nextSRCardState({ card: currentCard, correct });
    const updatedCard = { ...currentCard, interval, ease, nextReview };

    setSrCards((prev) => prev.map((card) => (card.question === question ? updatedCard : card)));

    dbWrite(
      createProgressWrite('updateSRCard', {
        question,
        updates: {
          next_review: new Date(updatedCard.nextReview).toISOString(),
          interval_days: updatedCard.interval,
          ease: updatedCard.ease,
        },
      }),
      'updateSRCard',
    );
  }, [user, srCards, dbWrite]);

  const getDueSRCards = useCallback(() => {
    return srCards.filter(c => c.nextReview <= Date.now());
  }, [srCards]);

  const toggleBookmark = useCallback(async (lessonKey, courseId, lessonTitle, options = {}) => {
    if (!user) return;
    const skipRemote = Boolean(options?.skipRemote);
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    const existing = bookmarks.find((bookmark) =>
      lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, COURSES),
    );

    if (existing) {
      setBookmarks((prev) => prev.filter((bookmark) =>
        !lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, COURSES),
      ));
      if (!skipRemote) {
        const removalKeys = new Set([existing.lesson_key, normalizedLessonKey]);
        removalKeys.forEach((key) => {
          dbWrite(createProgressWrite('removeBookmark', { lessonKey: key }), 'removeBookmark');
        });
      }
    } else {
      const newBookmark = {
        lesson_key: normalizedLessonKey,
        course_id: courseId,
        lesson_title: lessonTitle,
        created_at: new Date().toISOString(),
      };
      setBookmarks(prev => [...prev, newBookmark]);
      if (!skipRemote) {
        dbWrite(
          createProgressWrite('addBookmark', {
            bookmark: {
              lessonKey: normalizedLessonKey,
              courseId,
              lessonTitle,
            },
          }),
          'addBookmark',
        );
      }
    }
  }, [user, bookmarks, dbWrite]);

  const isBookmarked = useCallback((lessonKey) => {
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    return bookmarks.some((bookmark) =>
      lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, COURSES),
    );
  }, [bookmarks]);

  const saveNote = useCallback(async (lessonKey, content) => {
    if (!user) return;
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    setNotes(prev => ({ ...prev, [normalizedLessonKey]: content }));
    dbWrite(
      createProgressWrite('saveNote', {
        lessonKey: normalizedLessonKey,
        content,
      }),
      'saveNote',
    );
  }, [user, dbWrite]);

  const getNote = useCallback((lessonKey) => {
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    if (notes[normalizedLessonKey]) return notes[normalizedLessonKey];
    if (notes[lessonKey]) return notes[lessonKey];

    const equivalentKey = Object.keys(notes).find((storedKey) =>
      lessonKeysEquivalent(storedKey, normalizedLessonKey, COURSES),
    );
    return equivalentKey ? notes[equivalentKey] : '';
  }, [notes]);

  return {
    srCards, setSrCards,
    bookmarks, setBookmarks,
    notes, setNotes,
    addToSRQueue, updateSRCard, getDueSRCards,
    toggleBookmark, isBookmarked,
    saveNote, getNote,
  };
}

export function useSR() {
  return useContext(SRContext);
}
