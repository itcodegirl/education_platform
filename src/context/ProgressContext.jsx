// ═══════════════════════════════════════════════
// PROGRESS CONTEXT — XP, streak, badges, daily goals
// All data syncs to Supabase (cloud)
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DAILY_GOAL, TIMING, getLevel, getTodayString, getYesterdayString } from '../utils/helpers';
import { COURSES } from '../data';
import * as progressService from '../services/progressService';
import { isPerfectQuizScore, rewardKeys } from '../services/rewardPolicy';
import { lessonKeysEquivalent, resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';
import { LOCAL_STORAGE_SYNC_ERROR_EVENT } from '../hooks/useLocalStorage';
import { BADGE_DEFS, findNewlyEarnedBadges } from '../services/badgeRules';

// Re-exported here so existing call sites
// (`import { BADGE_DEFS } from '../../providers'`) keep working.
// The actual definitions and evaluation logic live in
// services/badgeRules.js.
export { BADGE_DEFS };

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
  challengeCompletions: [],
  isChallengeCompleted: () => false,
  markChallengeCompleted: () => false,
  // Count of DB writes that failed since the last successful read.
  // Used by the UI to show a "sync failed" banner; the optimistic
  // state is still the source of truth for the current session.
  syncFailed: 0,
  markSyncFailed: () => {},
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

function getChallengeCompletionStorageKey(userId) {
  return `chw-challenge-completions:${userId}`;
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

function normalizeStringSet(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(
    values
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => value.trim()),
  ));
}

function readChallengeCompletions(userId) {
  if (typeof window === 'undefined' || !userId) return [];

  try {
    const raw = window.localStorage.getItem(getChallengeCompletionStorageKey(userId));
    return normalizeStringSet(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function writeChallengeCompletions(userId, challengeIds) {
  if (typeof window === 'undefined' || !userId) return;

  window.localStorage.setItem(
    getChallengeCompletionStorageKey(userId),
    JSON.stringify(normalizeStringSet(challengeIds)),
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

  const markSyncFailed = useCallback(() => {
    setSyncFailed((count) => count + 1);
  }, []);

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
      markSyncFailed(label);
    }
  }, [markSyncFailed]);

  const clearSyncFailed = useCallback(() => setSyncFailed(0), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocalStorageFailure = (event) => {
      const key = typeof event.detail?.key === 'string' ? event.detail.key : 'unknown-key';
      const phase = typeof event.detail?.phase === 'string' ? event.detail.phase : 'unknown';
      markSyncFailed(`localStorage ${phase}:${key}`);
    };

    window.addEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handleLocalStorageFailure);
    return () => window.removeEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handleLocalStorageFailure);
  }, [markSyncFailed]);

  // ─── State ─────────────────────────────────────
  const [completed, setCompleted] = useState([]);
  const [quizScores, setQuizScores] = useState({});
  const [xpTotal, setXpTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [_streakLastDate, setStreakLastDate] = useState('');
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
  const [challengeCompletions, setChallengeCompletions] = useState([]);
  const challengeCompletionsRef = useRef(new Set());
  const streakStateRef = useRef({ days: 0, lastDate: '' });
  // XP popups are queued so back-to-back awards each get their full
  // dismissal animation. Without this, a perfect-quiz flow that awards
  // +30 XP (base) then +50 XP (perfect bonus) in the same tick would
  // overwrite the first popup before the user ever saw it.
  // The exposed `xpPopup` value is the head of the queue; `clearXPPopup`
  // shifts the head off so the next award (if any) takes its place.
  const [xpPopupQueue, setXpPopupQueue] = useState([]);
  const xpPopup = xpPopupQueue[0] || null;
  // Same queue pattern for badge unlock celebrations: a single
  // checkBadges() call can earn multiple badges (e.g. hitting a streak
  // milestone and a lesson-count milestone in the same action), and the
  // BadgeUnlock celebration is a 4.5s full-screen modal — overwriting it
  // would silently drop a real reward the learner just earned.
  const [newBadgeQueue, setNewBadgeQueue] = useState([]);
  const newBadge = newBadgeQueue[0] || null;
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

  const replaceChallengeCompletions = useCallback((userId, challengeIds, { persist = false } = {}) => {
    const normalizedChallengeIds = normalizeStringSet(challengeIds);
    challengeCompletionsRef.current = new Set(normalizedChallengeIds);
    setChallengeCompletions(normalizedChallengeIds);

    if (persist) {
      try {
        writeChallengeCompletions(userId, normalizedChallengeIds);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[ProgressContext] challenge completion write failed:', err);
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
    streakStateRef.current = { days: 0, lastDate: '' };
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
    challengeCompletionsRef.current = new Set();
    setChallengeCompletions([]);
    setXpPopupQueue([]);
    setNewBadgeQueue([]);
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

      const scores = {};
      quizRes.data?.forEach(r => { scores[r.quiz_key] = r.score; });
      setQuizScores(scores);

      const storedRewardHistory = readRewardHistory(uid);
      const completedLessonRewardKeys = completedLessonKeys
        .filter((lessonKey) => typeof lessonKey === 'string' && lessonKey.trim())
        .map((lessonKey) => rewardKeys.lessonComplete(lessonKey));
      const completedQuizRewardKeys = Object.entries(scores).flatMap(([quizKey, score]) => {
        if (typeof quizKey !== 'string' || !quizKey.trim()) return [];
        const keys = [rewardKeys.quizComplete(quizKey)];
        if (isPerfectQuizScore(score)) {
          keys.push(rewardKeys.quizPerfect(quizKey));
        }
        return keys;
      });
      const storedChallengeCompletions = readChallengeCompletions(uid);
      replaceChallengeCompletions(uid, storedChallengeCompletions);
      const completedChallengeRewardKeys = storedChallengeCompletions.map((challengeId) =>
        rewardKeys.challengeComplete(challengeId),
      );
      replaceRewardHistory(
        uid,
        [
          ...storedRewardHistory,
          ...completedLessonRewardKeys,
          ...completedQuizRewardKeys,
          ...completedChallengeRewardKeys,
        ],
        {
          persist:
            completedLessonRewardKeys.length > 0 ||
            completedQuizRewardKeys.length > 0 ||
            completedChallengeRewardKeys.length > 0,
        },
      );

      setXpTotal(xpRes.data?.total || 0);

      const sd = streakRes.data;
      if (sd) {
        const loadedStreak = sd.days || 0;
        const loadedLastDate = sd.last_date || '';
        setStreak(loadedStreak);
        setStreakLastDate(loadedLastDate);
        streakStateRef.current = { days: loadedStreak, lastDate: loadedLastDate };
      } else {
        streakStateRef.current = { days: 0, lastDate: '' };
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
  }, [user, loadVersion, resetUserState, replaceRewardHistory, replaceChallengeCompletions]);

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
  const awardXP = useCallback(async (amount, reason, options = {}) => {
    if (!user) return;
    const skipRemote = Boolean(options?.skipRemote);
    const oldLevel = getLevel(xpTotal);
    const newTotal = xpTotal + amount;
    const newLevel = getLevel(newTotal);

    setXpTotal(newTotal);
    setXpPopupQueue((queue) => [
      ...queue,
      {
        amount,
        reason,
        newLevel: newLevel > oldLevel ? newLevel : null,
      },
    ]);

    if (!skipRemote) {
      dbWrite(progressService.updateXP(user.id, newTotal), 'updateXP');
    }
  }, [user, xpTotal, dbWrite]);

  // Shifts the currently-displayed popup off the queue. If more popups
  // are queued, the next one becomes the new head and renders next.
  const clearXPPopup = useCallback(() => {
    setXpPopupQueue((queue) => (queue.length > 0 ? queue.slice(1) : queue));
  }, []);

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

  const isChallengeCompleted = useCallback((challengeId) => {
    if (typeof challengeId !== 'string' || !challengeId.trim()) return false;
    return challengeCompletionsRef.current.has(challengeId.trim());
  }, []);

  const markChallengeCompleted = useCallback((challengeId) => {
    if (!user || typeof challengeId !== 'string' || !challengeId.trim()) return false;
    const normalizedChallengeId = challengeId.trim();

    if (challengeCompletionsRef.current.has(normalizedChallengeId)) return false;

    const nextChallengeIds = [...challengeCompletionsRef.current, normalizedChallengeId];
    challengeCompletionsRef.current = new Set(nextChallengeIds);
    setChallengeCompletions(nextChallengeIds);

    try {
      writeChallengeCompletions(user.id, nextChallengeIds);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[ProgressContext] challenge completion write failed:', err);
      }
      setSyncFailed((count) => count + 1);
    }

    return true;
  }, [user]);

  // ─── Daily Goal ───────────────────────────────
  const recordDailyActivity = useCallback(async () => {
    if (!user) return;
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const currentCount = dailyDate === today ? dailyCount : 0;
    const newCount = Math.min(currentCount + 1, DAILY_GOAL);
    const streakState = streakStateRef.current;

    if (streakState.lastDate !== today) {
      const nextStreakDays = streakState.lastDate === yesterday ? streakState.days + 1 : 1;
      streakStateRef.current = { days: nextStreakDays, lastDate: today };
      setStreak(nextStreakDays);
      setStreakLastDate(today);
      dbWrite(progressService.updateStreak(user.id, nextStreakDays, today), 'updateStreak');
    }

    setDailyCount(newCount);
    setDailyDate(today);

    dbWrite(progressService.updateDailyGoal(user.id, today, newCount), 'updateDailyGoal');
  }, [user, dailyCount, dailyDate, dbWrite]);

  // ─── Badges ───────────────────────────────────
  // The pure rules (which conditions earn which badge) live in
  // services/badgeRules.js. This callback's only job is to build a
  // context snapshot from current state, ask findNewlyEarnedBadges
  // what's freshly earned, and then persist + celebrate it.
  const checkBadges = useCallback(async () => {
    if (!user) return;

    const ctx = {
      completedCount: completed.length,
      quizCount: Object.keys(quizScores).length,
      hasPerfect: Object.values(quizScores).some((v) => {
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

    const newlyEarned = findNewlyEarnedBadges(ctx, earnedBadges);
    if (newlyEarned.length === 0) return;

    const updated = { ...earnedBadges };
    const today = getTodayString();
    for (const badge of newlyEarned) {
      updated[badge.id] = { date: today };
      dbWrite(progressService.awardBadge(user.id, badge.id), `awardBadge:${badge.id}`);
    }

    setEarnedBadges(updated);
    // Enqueue every newly earned badge so each one gets its own
    // celebration in turn, instead of all but the first being lost.
    setNewBadgeQueue((queue) => [...queue, ...newlyEarned]);
  }, [user, completed, quizScores, xpTotal, streak, coursesVisited, dailyCount, dailyDate, earnedBadges, bookmarks, notes, dbWrite]);

  useEffect(() => {
    if (dataLoaded) checkBadges();
  }, [dataLoaded, checkBadges, completed.length, quizScores, xpTotal, dailyCount, bookmarks.length, notes]);

  const clearNewBadge = useCallback(() => {
    setNewBadgeQueue((queue) => (queue.length > 0 ? queue.slice(1) : queue));
  }, []);

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
    challengeCompletions,
    isChallengeCompleted,
    markChallengeCompleted,
    syncFailed,
    markSyncFailed,
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
    challengeCompletions,
    isChallengeCompleted,
    markChallengeCompleted,
    syncFailed,
    markSyncFailed,
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
