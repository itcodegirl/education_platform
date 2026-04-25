// ═══════════════════════════════════════════════
// PROGRESS CONTEXT — XP, streak, badges, daily goals
// All data syncs to Supabase (cloud)
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DAILY_GOAL, TIMING, getLevel, getTodayString, getYesterdayString } from '../utils/helpers';
import { COURSES } from '../data';
import * as progressService from '../services/progressService';
import { rewardKeys } from '../services/rewardPolicy';
import { lessonKeysEquivalent, resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';

// ─── Badge Definitions ──────────────────────────
export const BADGE_DEFS = [
  { id: 'first_lesson', icon: '🌱', name: 'First Steps', desc: 'Complete your first lesson' },
  { id: 'five_lessons', icon: '📚', name: 'Getting Started', desc: 'Complete 5 lessons' },
  { id: 'ten_lessons', icon: '🔥', name: 'On Fire', desc: 'Complete 10 lessons' },
  { id: 'twenty_lessons', icon: '💪', name: 'Unstoppable', desc: 'Complete 20 lessons' },
  { id: 'fifty_lessons', icon: '👑', name: 'Legend', desc: 'Complete 50 lessons' },
  { id: 'first_quiz', icon: '🧠', name: 'Quiz Taker', desc: 'Complete your first quiz' },
  { id: 'five_quizzes', icon: '🎓', name: 'Scholar', desc: 'Complete 5 quizzes' },
  { id: 'perfect_quiz', icon: '💯', name: 'Perfectionist', desc: 'Get 100% on any quiz' },
  { id: 'streak_3', icon: '📅', name: 'Hat Trick', desc: '3-day learning streak' },
  { id: 'streak_7', icon: '⚡', name: 'Weekly Warrior', desc: '7-day learning streak' },
  { id: 'level_5', icon: '⭐', name: 'Rising Star', desc: 'Reach Level 5' },
  { id: 'level_10', icon: '🌟', name: 'Superstar', desc: 'Reach Level 10' },
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Study after 10 PM' },
  { id: 'early_bird', icon: '🐦', name: 'Early Bird', desc: 'Study before 7 AM' },
  { id: 'explorer', icon: '🗺️', name: 'Explorer', desc: 'Visit all 4 course tracks' },
  { id: 'daily_goal', icon: '🎯', name: 'Goal Crusher', desc: 'Complete your daily goal' },
  { id: 'bookworm', icon: '📖', name: 'Bookworm', desc: 'Bookmark 10 lessons' },
  { id: 'note_taker', icon: '✏️', name: 'Note Taker', desc: 'Write 5 notes' },
];

const ProgressContext = createContext({
  completed: [],
  completedSet: new Set(),
  toggleLesson: () => {},
  quizScores: {},
  saveQuizScore: () => {},
  lastPosition: null,
  savePosition: () => {},
  coursesVisited: [],
  trackCourseVisit: () => {},
  dataLoaded: false,
  loadError: null,
  retryLoad: () => {},
  rewardHistory: [],
  hasRewardBeenAwarded: () => false,
  markRewardAwarded: () => false,
  // Count of DB writes that failed since the last successful read.
  // Used by the UI to show a "sync failed" banner; the optimistic
  // state is still the source of truth for the current session.
  syncFailed: 0,
  clearSyncFailed: () => {},
});

const XPContext = createContext({
  xpTotal: 0,
  awardXP: () => {},
  xpPopup: null,
  clearXPPopup: () => {},
  streak: 0,
  dailyCount: 0,
  recordDailyActivity: () => {},
  earnedBadges: [],
  newBadge: null,
  clearNewBadge: () => {},
});

const SRContext = createContext({
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

function getRewardHistoryStorageKey(userId) {
  return `chw-reward-history:${userId}`;
}

function normalizeRewardHistory(keys) {
  if (!Array.isArray(keys)) return [];
  return Array.from(new Set(
    keys
      .filter((key) => typeof key === 'string' && key.trim())
      .map((key) => key.trim()),
  ));
}

function readRewardHistory(userId) {
  if (typeof window === 'undefined' || !userId) return [];

  try {
    const raw = window.localStorage.getItem(getRewardHistoryStorageKey(userId));
    return normalizeRewardHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function writeRewardHistory(userId, keys) {
  if (typeof window === 'undefined' || !userId) return;

  window.localStorage.setItem(
    getRewardHistoryStorageKey(userId),
    JSON.stringify(normalizeRewardHistory(keys)),
  );
}

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [loadVersion, setLoadVersion] = useState(0);
  // Counter for DB writes that have failed since the last successful
  // load. The optimistic state is still the source of truth for the
  // session — this is just so the UI can surface "your progress did
  // not save to the cloud" instead of silently losing writes.
  const [syncFailed, setSyncFailed] = useState(0);

  // Supabase write helper. Optimistic state is updated BEFORE this is
  // called, so we catch and report failures rather than rollback.
  // Previously this silently swallowed all errors, which made every
  // sync failure invisible — a real correctness bug flagged in the
  // portfolio audit. Now we:
  //   1. console.warn in dev so the developer sees it immediately
  //   2. bump the syncFailed counter exposed via context so the UI
  //      can show a "sync failed, your work is still saved locally"
  //      banner. Calling retryLoad() will reset the counter.
  //   3. accept a human-readable label so the warning identifies
  //      which service call failed.
  const dbWrite = useCallback(async (operation, label = 'db-write') => {
    try {
      await operation;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          `[ProgressContext] ${label} failed — optimistic state kept:`,
          err,
        );
      }
      setSyncFailed((count) => count + 1);
    }
  }, []);

  const clearSyncFailed = useCallback(() => setSyncFailed(0), []);

  // Guard: prevent the streak effect from firing more than once per
  // data-load, including in React StrictMode where effects run twice.
  const streakSyncedRef = useRef(false);

  // ─── State ─────────────────────────────────────
  const [completed, setCompleted] = useState([]);
  const [quizScores, setQuizScores] = useState({});
  const [xpTotal, setXpTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakLastDate, setStreakLastDate] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyDate, setDailyDate] = useState('');
  const [earnedBadges, setEarnedBadges] = useState({});
  const [srCards, setSrCards] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [coursesVisited, setCoursesVisited] = useState([]);
  const [lastPosition, setLastPosition] = useState({ course: '', mod: '', les: '', time: 0 });
  const [rewardHistory, setRewardHistory] = useState([]);
  const rewardHistoryRef = useRef(new Set());
  const [xpPopup, setXpPopup] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const replaceRewardHistory = useCallback((userId, keys, { persist = false } = {}) => {
    const normalizedKeys = normalizeRewardHistory(keys);
    rewardHistoryRef.current = new Set(normalizedKeys);
    setRewardHistory(normalizedKeys);

    if (persist) {
      try {
        writeRewardHistory(userId, normalizedKeys);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[ProgressContext] reward history write failed:', err);
        }
        setSyncFailed((count) => count + 1);
      }
    }
  }, []);

  const resetUserState = useCallback(() => {
    setCompleted([]);
    setQuizScores({});
    setXpTotal(0);
    setStreak(0);
    setStreakLastDate('');
    setDailyCount(0);
    setDailyDate('');
    setEarnedBadges({});
    setSrCards([]);
    setBookmarks([]);
    setNotes({});
    setCoursesVisited([]);
    setLastPosition({ course: '', mod: '', les: '', time: 0 });
    rewardHistoryRef.current = new Set();
    setRewardHistory([]);
    setXpPopup(null);
    setNewBadge(null);
  }, []);

  // ─── Load all data from Supabase on login ──────
  useEffect(() => {
    if (!user) {
      resetUserState();
      setDataLoaded(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    const loadAll = async () => {
      const uid = user.id;
      setLoadError(null);

      try {
      // Parallel fetch all tables
      const results = await progressService.fetchAllUserData(uid);
      if (cancelled) return;
      const { progress: progressRes, quiz: quizRes, xp: xpRes, streak: streakRes,
        daily: dailyRes, badges: badgesRes, sr: srRes, bookmarks: bookmarkRes,
        notes: notesRes, visited: visitedRes, position: posRes } = results;

      const completedLessonKeys = progressRes.data?.map(r => r.lesson_key) || [];
      setCompleted(completedLessonKeys);

      const storedRewardHistory = readRewardHistory(uid);
      const completedLessonRewardKeys = completedLessonKeys
        .filter((lessonKey) => typeof lessonKey === 'string' && lessonKey.trim())
        .map((lessonKey) => rewardKeys.lessonComplete(lessonKey));
      replaceRewardHistory(
        uid,
        [...storedRewardHistory, ...completedLessonRewardKeys],
        { persist: completedLessonRewardKeys.length > 0 },
      );

      const scores = {};
      quizRes.data?.forEach(r => { scores[r.quiz_key] = r.score; });
      setQuizScores(scores);

      setXpTotal(xpRes.data?.total || 0);

      const sd = streakRes.data;
      if (sd) {
        setStreak(sd.days || 0);
        setStreakLastDate(sd.last_date || '');
      }

      const dd = dailyRes.data;
      const today = getTodayString();
      if (dd && dd.goal_date === today) {
        setDailyCount(dd.count || 0);
        setDailyDate(today);
      } else {
        setDailyCount(0);
        setDailyDate(today);
      }

      const badges = {};
      badgesRes.data?.forEach(r => { badges[r.badge_id] = { date: r.earned_at?.slice(0, 10) }; });
      setEarnedBadges(badges);

      setSrCards(srRes.data?.map(r => ({
        question: r.question,
        code: r.code,
        options: r.options,
        correct: r.correct,
        explanation: r.explanation,
        source: r.source,
        added: new Date(r.added_at).getTime(),
        nextReview: new Date(r.next_review).getTime(),
        interval: r.interval_days,
        ease: r.ease,
      })) || []);

      setBookmarks(bookmarkRes.data || []);

      const notesMap = {};
      notesRes.data?.forEach(r => { notesMap[r.lesson_key] = r.content; });
      setNotes(notesMap);

      setCoursesVisited(visitedRes.data?.map(r => r.course_id) || []);

      if (posRes.data) {
        setLastPosition({
          course: posRes.data.course || '',
          mod: posRes.data.mod || '',
          les: posRes.data.les || '',
          time: posRes.data.updated_at ? new Date(posRes.data.updated_at).getTime() : 0,
        });
      }

      setDataLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load data:', err);
        setLoadError(err.message || 'Could not connect to database');
        setDataLoaded(true); // still mark loaded so UI isn't stuck
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [user, loadVersion, resetUserState, replaceRewardHistory]);

  // ─── Streak check on load ─────────────────────
  // Reset the guard whenever the user session changes so a fresh login
  // always runs the streak check once.
  useEffect(() => {
    streakSyncedRef.current = false;
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    // Only run once per data-load (guards against StrictMode double-invoke
    // and against re-runs triggered by unrelated state changes).
    if (streakSyncedRef.current) return;
    streakSyncedRef.current = true;

    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (streakLastDate === today) return;

    let newDays;
    if (streakLastDate === yesterday) {
      newDays = streak + 1;
    } else {
      newDays = 1;
    }

    setStreak(newDays);
    setStreakLastDate(today);

    dbWrite(progressService.updateStreak(user.id, newDays, today), 'updateStreak');
  }, [user, dataLoaded, streakLastDate, streak, dbWrite]);

  // ─── Progress ─────────────────────────────────
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const toggleLesson = useCallback(async (lessonKey, options = {}) => {
    if (!user) return;
    const skipRemote = Boolean(options?.skipRemote);
    const has = completedSet.has(lessonKey);

    if (has) {
      setCompleted(prev => prev.filter(k => k !== lessonKey));
      if (!skipRemote) {
        dbWrite(progressService.removeLesson(user.id, lessonKey), 'removeLesson');
      }
    } else {
      setCompleted(prev => [...prev, lessonKey]);
      if (!skipRemote) {
        dbWrite(progressService.addLesson(user.id, lessonKey), 'addLesson');
      }
    }
  }, [user, completedSet, dbWrite]);

  const saveQuizScore = useCallback(async (quizKey, score) => {
    if (!user) return;
    setQuizScores(prev => ({ ...prev, [quizKey]: score }));
    dbWrite(progressService.saveQuizScore(user.id, quizKey, score), 'saveQuizScore');
  }, [user, dbWrite]);

  // ─── XP ───────────────────────────────────────
  const awardXP = useCallback(async (amount, reason) => {
    if (!user) return;
    const oldLevel = getLevel(xpTotal);
    const newTotal = xpTotal + amount;
    const newLevel = getLevel(newTotal);

    setXpTotal(newTotal);
    setXpPopup({
      amount,
      reason,
      newLevel: newLevel > oldLevel ? newLevel : null,
    });

    dbWrite(progressService.updateXP(user.id, newTotal), 'updateXP');
  }, [user, xpTotal, dbWrite]);

  const clearXPPopup = useCallback(() => setXpPopup(null), []);

  const hasRewardBeenAwarded = useCallback((rewardKey) => {
    return rewardHistoryRef.current.has(rewardKey);
  }, []);

  const markRewardAwarded = useCallback((rewardKey) => {
    if (!user || typeof rewardKey !== 'string' || !rewardKey.trim()) return false;
    const normalizedRewardKey = rewardKey.trim();

    if (rewardHistoryRef.current.has(normalizedRewardKey)) return false;

    const nextKeys = [...rewardHistoryRef.current, normalizedRewardKey];
    rewardHistoryRef.current = new Set(nextKeys);
    setRewardHistory(nextKeys);

    try {
      writeRewardHistory(user.id, nextKeys);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[ProgressContext] reward history write failed:', err);
      }
      setSyncFailed((count) => count + 1);
    }

    return true;
  }, [user]);

  // ─── Daily Goal ───────────────────────────────
  const recordDailyActivity = useCallback(async () => {
    if (!user) return;
    const today = getTodayString();
    const currentCount = dailyDate === today ? dailyCount : 0;
    const newCount = Math.min(currentCount + 1, DAILY_GOAL);

    setDailyCount(newCount);
    setDailyDate(today);

    dbWrite(progressService.updateDailyGoal(user.id, today, newCount), 'updateDailyGoal');
  }, [user, dailyCount, dailyDate, dbWrite]);

  // ─── Badges ───────────────────────────────────
  const checkBadges = useCallback(async () => {
    if (!user) return;

    const ctx = {
      completedCount: completed.length,
      quizCount: Object.keys(quizScores).length,
      hasPerfect: Object.values(quizScores).some(v => {
        const [a, b] = v.split('/');
        return a === b && parseInt(a) > 0;
      }),
      xpTotal,
      streak,
      coursesVisitedCount: coursesVisited.length,
      dailyCount: dailyDate === getTodayString() ? dailyCount : 0,
      hour: new Date().getHours(),
      bookmarkCount: bookmarks.length,
      noteCount: Object.keys(notes).length,
    };

    const checks = {
      first_lesson: ctx.completedCount >= 1,
      five_lessons: ctx.completedCount >= 5,
      ten_lessons: ctx.completedCount >= 10,
      twenty_lessons: ctx.completedCount >= 20,
      fifty_lessons: ctx.completedCount >= 50,
      first_quiz: ctx.quizCount >= 1,
      five_quizzes: ctx.quizCount >= 5,
      perfect_quiz: ctx.hasPerfect,
      streak_3: ctx.streak >= 3,
      streak_7: ctx.streak >= 7,
      level_5: getLevel(ctx.xpTotal) >= 5,
      level_10: getLevel(ctx.xpTotal) >= 10,
      night_owl: ctx.hour >= 22,
      early_bird: ctx.hour < 7,
      explorer: ctx.coursesVisitedCount >= 4,
      daily_goal: ctx.dailyCount >= DAILY_GOAL,
      bookworm: ctx.bookmarkCount >= 10,
      note_taker: ctx.noteCount >= 5,
    };

    let foundNew = null;
    const updated = { ...earnedBadges };

    for (const b of BADGE_DEFS) {
      if (!updated[b.id] && checks[b.id]) {
        updated[b.id] = { date: getTodayString() };
        if (!foundNew) foundNew = b;

        dbWrite(progressService.awardBadge(user.id, b.id), `awardBadge:${b.id}`);
      }
    }

    if (foundNew) {
      setEarnedBadges(updated);
      setNewBadge(foundNew);
    }
  }, [user, completed, quizScores, xpTotal, streak, coursesVisited, dailyCount, dailyDate, earnedBadges, bookmarks, notes, dbWrite]);

  useEffect(() => {
    if (dataLoaded) checkBadges();
  }, [dataLoaded, checkBadges, completed.length, quizScores, xpTotal, dailyCount, bookmarks.length, notes]);

  const clearNewBadge = useCallback(() => setNewBadge(null), []);

  // ─── Spaced Repetition ────────────────────────
  const addToSRQueue = useCallback(async (cards) => {
    if (!user) return;
    const existing = new Set(srCards.map(c => c.question));
    const newCards = cards.filter(c => !existing.has(c.question));

    setSrCards(prev => [...prev, ...newCards]);

    for (const card of newCards) {
      dbWrite(progressService.addSRCard(user.id, card), 'addSRCard');
    }
  }, [user, srCards, dbWrite]);

  const updateSRCard = useCallback(async (question, correct) => {
    if (!user) return;

    const currentCard = srCards.find(c => c.question === question);
    if (!currentCard) return;

    const nextInterval = correct
      ? Math.round(currentCard.interval * currentCard.ease)
      : 1;
    const nextEase = correct
      ? Math.min(currentCard.ease + 0.1, 3.0)
      : Math.max(currentCard.ease - 0.2, 1.3);
    const nextReviewTs = Date.now() + (correct ? nextInterval : 1) * TIMING.dayMs;
    const updatedCard = {
      ...currentCard,
      interval: nextInterval,
      ease: nextEase,
      nextReview: nextReviewTs,
    };

    setSrCards(prev => prev.map(card => {
      if (card.question !== question) return card;
      return updatedCard;
    }));

    dbWrite(
      progressService.updateSRCard(user.id, question, {
        next_review: new Date(updatedCard.nextReview).toISOString(),
        interval_days: updatedCard.interval,
        ease: updatedCard.ease,
      }),
      'updateSRCard',
    );
  }, [user, srCards, dbWrite]);

  const getDueSRCards = useCallback(() => {
    return srCards.filter(c => c.nextReview <= Date.now());
  }, [srCards]);

  // ─── Bookmarks (NEW) ─────────────────────────
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
          dbWrite(progressService.removeBookmark(user.id, key), 'removeBookmark');
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
        dbWrite(progressService.addBookmark(user.id, {
          lessonKey: normalizedLessonKey,
          courseId,
          lessonTitle,
        }), 'addBookmark');
      }
    }
  }, [user, bookmarks, dbWrite]);

  const isBookmarked = useCallback((lessonKey) => {
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    return bookmarks.some((bookmark) =>
      lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, COURSES),
    );
  }, [bookmarks]);

  // ─── Notes (NEW) ─────────────────────────────
  const saveNote = useCallback(async (lessonKey, content) => {
    if (!user) return;
    const normalizedLessonKey = normalizeLessonKey(lessonKey);
    setNotes(prev => ({ ...prev, [normalizedLessonKey]: content }));
    dbWrite(progressService.saveNote(user.id, normalizedLessonKey, content), 'saveNote');
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

  // ─── Position ─────────────────────────────────
  const savePosition = useCallback(async (pos) => {
    if (!user) return;
    setLastPosition(prev => ({ ...prev, ...pos, time: Date.now() }));
    dbWrite(progressService.savePosition(user.id, pos), 'savePosition');
  }, [user, dbWrite]);

  // ─── Courses Visited ──────────────────────────
  const trackCourseVisit = useCallback(async (courseId) => {
    if (!user) return;
    if (coursesVisited.includes(courseId)) return;
    setCoursesVisited(prev => [...prev, courseId]);
    dbWrite(progressService.trackCourseVisit(user.id, courseId), 'trackCourseVisit');
  }, [user, coursesVisited, dbWrite]);

  const retryLoad = useCallback(() => {
    setDataLoaded(false);
    setLoadError(null);
    // A fresh load replaces optimistic state with canonical DB state,
    // so any stale "sync failed" counter is irrelevant after this.
    setSyncFailed(0);
    setLoadVersion((version) => version + 1);
  }, []);

  const progressValue = useMemo(() => ({
    completed,
    completedSet,
    toggleLesson,
    quizScores,
    saveQuizScore,
    lastPosition,
    savePosition,
    coursesVisited,
    trackCourseVisit,
    dataLoaded,
    loadError,
    retryLoad,
    rewardHistory,
    hasRewardBeenAwarded,
    markRewardAwarded,
    syncFailed,
    clearSyncFailed,
  }), [
    completed,
    completedSet,
    toggleLesson,
    quizScores,
    saveQuizScore,
    lastPosition,
    savePosition,
    coursesVisited,
    trackCourseVisit,
    dataLoaded,
    loadError,
    retryLoad,
    rewardHistory,
    hasRewardBeenAwarded,
    markRewardAwarded,
    syncFailed,
    clearSyncFailed,
  ]);

  const xpValue = useMemo(() => ({
    xpTotal,
    awardXP,
    xpPopup,
    clearXPPopup,
    streak,
    dailyCount,
    recordDailyActivity,
    earnedBadges,
    newBadge,
    clearNewBadge,
  }), [
    xpTotal,
    awardXP,
    xpPopup,
    clearXPPopup,
    streak,
    dailyCount,
    recordDailyActivity,
    earnedBadges,
    newBadge,
    clearNewBadge,
  ]);

  const srValue = useMemo(() => ({
    srCards,
    addToSRQueue,
    updateSRCard,
    getDueSRCards,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    notes,
    saveNote,
    getNote,
  }), [
    srCards,
    addToSRQueue,
    updateSRCard,
    getDueSRCards,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    notes,
    saveNote,
    getNote,
  ]);

  return (
    <ProgressContext.Provider value={progressValue}>
      <XPContext.Provider value={xpValue}>
        <SRContext.Provider value={srValue}>
          {children}
        </SRContext.Provider>
      </XPContext.Provider>
    </ProgressContext.Provider>
  );
}

export function useProgressData() {
  return useContext(ProgressContext);
}

export function useXP() {
  return useContext(XPContext);
}

export function useSR() {
  return useContext(SRContext);
}

// Backward-compatible aggregate hook for older consumers.
// Prefer useProgressData/useXP/useSR in new code to avoid
// cross-domain re-renders.
export function useProgress() {
  const progress = useProgressData();
  const xp = useXP();
  const sr = useSR();
  return useMemo(() => ({ ...progress, ...xp, ...sr }), [progress, xp, sr]);
}
