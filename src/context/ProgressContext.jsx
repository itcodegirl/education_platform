// ═══════════════════════════════════════════════
// PROGRESS CONTEXT — XP, streak, badges, daily goals
// All data syncs to Supabase (cloud)
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  DAILY_GOAL,
  getActiveDailyCount,
  getActiveStreakDays,
  getLevel,
  getPausedStreak,
  getTodayString,
  getYesterdayString,
} from '../utils/helpers';
import { COURSES } from '../data';
import * as progressService from '../services/progressService';
import {
  createProgressWrite,
  enqueueProgressWrite,
  executeProgressWrite,
  readProgressWriteQueue,
  replayProgressWriteQueue,
} from '../services/progressWriteQueue';
import {
  trackProgressSyncQueued,
  trackProgressSyncReplay,
} from '../services/progressSyncTelemetry';
import { getProgressWriteFailure } from '../services/progressWriteRuntime';
import { isPerfectQuizScore, rewardKeys } from '../services/rewardPolicy';
import { lessonKeysEquivalent, resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';
import { LOCAL_STORAGE_SYNC_ERROR_EVENT } from '../hooks/useLocalStorage';
import { useTodayKey } from '../hooks/useTodayKey';
import { findNewlyEarnedBadges } from '../services/badgeRules';
import { nextSRCardState } from '../services/srAlgorithm';
import {
  normalizeRewardHistory,
  normalizeStringList as normalizeStringSet,
  readChallengeCompletions,
  readRewardHistory,
  writeChallengeCompletions,
  writeRewardHistory,
} from '../utils/learnerLocalStore';

// BADGE_DEFS is imported above from '../data/badges' (the canonical
// catalog home) and re-exported via providers/ProgressProvider, so
// existing `import { BADGE_DEFS } from '../../providers'` call sites
// keep working without going through this file.

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
  pendingSyncWrites: 0,
  syncRetryInFlight: false,
  markSyncFailed: () => {},
  clearSyncFailed: () => {},
  enqueuePendingSyncWrite: () => false,
  retryPendingSyncWrites: async () => ({ processed: 0, remaining: 0 }),
});

const XPContext = createContext({
  xpTotal: 0,
  awardXP: () => {},
  xpPopup: null,
  clearXPPopup: () => {},
  streak: 0,
  // pausedStreak is null when there is no lapsed streak to revive.
  // Shape when present: { days: number, lastDate: 'YYYY-MM-DD' }.
  pausedStreak: null,
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

// Per-learner localStorage helpers (reward history, challenge
// completions, normalization) live in utils/learnerLocalStore so
// they can be unit-tested independently of the provider.

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [loadVersion, setLoadVersion] = useState(0);
  // Date key (YYYY-MM-DD UTC) that ticks at midnight + on tab
  // visibility resume. Drives the active-streak / paused-streak /
  // active-daily-count guards so they recompute when the wall
  // clock crosses midnight inside an open tab.
  const todayKey = useTodayKey();
  // Counter for DB writes that have failed since the last successful
  // load. The optimistic state is still the source of truth for the
  // session — this is just so the UI can surface "your progress did
  // not save to the cloud" instead of silently losing writes.
  const [syncFailed, setSyncFailed] = useState(0);
  const [pendingSyncWrites, setPendingSyncWrites] = useState(0);
  const [syncRetryInFlight, setSyncRetryInFlight] = useState(false);
  const pendingSyncWritesRef = useRef(0);
  const hydratePendingQueueRef = useRef(false);

  const markSyncFailed = useCallback(() => {
    setSyncFailed((count) => count + 1);
  }, []);

  const syncPendingQueueCount = useCallback((targetUserId = userId) => {
    if (!targetUserId) {
      pendingSyncWritesRef.current = 0;
      setPendingSyncWrites(0);
      return 0;
    }

    const queueCount = readProgressWriteQueue(targetUserId).length;
    pendingSyncWritesRef.current = queueCount;
    setPendingSyncWrites(queueCount);
    return queueCount;
  }, [userId]);

  const enqueuePendingSyncWrite = useCallback((writeLike, label = 'sync-write') => {
    if (!userId || !writeLike?.operation) return false;

    try {
      const queueItem = writeLike.id
        ? writeLike
        : createProgressWrite(writeLike.operation, writeLike.payload, { label });

      const queue = enqueueProgressWrite(userId, queueItem);
      trackProgressSyncQueued({
        operation: queueItem.operation,
        label: queueItem.label,
        queueSize: queue.length,
      });
      hydratePendingQueueRef.current = false;
      syncPendingQueueCount(userId);
      return true;
    } catch (queueErr) {
      if (import.meta.env.DEV) {
        console.warn(
          `[ProgressContext] ${label} could not be added to the retry queue:`,
          queueErr,
        );
      }
      markSyncFailed(label);
      return false;
    }
  }, [markSyncFailed, syncPendingQueueCount, userId]);

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
  const dbWrite = useCallback(async (write, label = 'db-write') => {
    if (!userId) return { queued: false, skipped: true };

    try {
      const result = await executeProgressWrite(userId, write);
      const failure = getProgressWriteFailure(result);
      if (failure) throw failure;
      return { queued: false, skipped: false };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          `[ProgressContext] ${label} failed — optimistic state kept:`,
          err,
        );
      }
      const queued = enqueuePendingSyncWrite(write, label);
      return { queued, skipped: false };
    }
  }, [enqueuePendingSyncWrite, userId]);

  const clearSyncFailed = useCallback(() => setSyncFailed(0), []);

  const retryPendingSyncWrites = useCallback(async ({
    reloadAfterSuccess = false,
    trigger = 'manual',
  } = {}) => {
    if (!userId || syncRetryInFlight || pendingSyncWritesRef.current === 0) {
      return {
        processed: 0,
        remaining: pendingSyncWritesRef.current,
        queue: readProgressWriteQueue(userId),
        failedItem: null,
        error: null,
      };
    }

    setSyncRetryInFlight(true);
    try {
      const result = await replayProgressWriteQueue(userId);
      pendingSyncWritesRef.current = result.remaining;
      setPendingSyncWrites(result.remaining);
      trackProgressSyncReplay({
        trigger,
        processed: result.processed,
        remaining: result.remaining,
        failedItem: result.failedItem,
        error: result.error,
      });

      if (result.error) {
        markSyncFailed('retryPendingSyncWrites');
      } else if (result.remaining === 0) {
        hydratePendingQueueRef.current = false;
        if (reloadAfterSuccess) {
          setLoadVersion((version) => version + 1);
        }
      }

      return result;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[ProgressContext] retryPendingSyncWrites failed:', err);
      }
      trackProgressSyncReplay({
        trigger,
        processed: 0,
        remaining: pendingSyncWritesRef.current,
        error: err,
      });
      markSyncFailed('retryPendingSyncWrites');
      return {
        processed: 0,
        remaining: pendingSyncWritesRef.current,
        queue: readProgressWriteQueue(userId),
        failedItem: null,
        error: err,
      };
    } finally {
      setSyncRetryInFlight(false);
    }
  }, [markSyncFailed, syncRetryInFlight, userId]);

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

  useEffect(() => {
    if (!userId) {
      hydratePendingQueueRef.current = false;
      pendingSyncWritesRef.current = 0;
      setPendingSyncWrites(0);
      setSyncRetryInFlight(false);
      return;
    }

    const queueCount = syncPendingQueueCount(userId);
    hydratePendingQueueRef.current = queueCount > 0;
  }, [syncPendingQueueCount, userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return undefined;

    const handleOnline = () => {
      if (pendingSyncWritesRef.current > 0) {
        retryPendingSyncWrites({ trigger: 'online' });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [retryPendingSyncWrites, userId]);

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
  const [challengeCompletions, setChallengeCompletions] = useState([]);
  const challengeCompletionsRef = useRef(new Set());
  const streakStateRef = useRef({ days: 0, lastDate: '' });
  // Same ref-mirroring pattern as streakStateRef. Two recordDailyActivity
  // calls in the same React batch would otherwise both read the stale
  // closure-captured dailyCount/dailyDate and lose an increment. The ref
  // updates synchronously so the second call sees the first call's
  // value.
  const dailyStateRef = useRef({ count: 0, date: '' });
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

  useEffect(() => {
    if (!userId || !dataLoaded || loadError) return;
    if (!hydratePendingQueueRef.current || pendingSyncWrites === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    hydratePendingQueueRef.current = false;
    retryPendingSyncWrites({ reloadAfterSuccess: true, trigger: 'session-replay' });
  }, [
    dataLoaded,
    loadError,
    pendingSyncWrites,
    retryPendingSyncWrites,
    userId,
  ]);

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
    dailyStateRef.current = { count: 0, date: '' };
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
        // No streak row exists for this user yet. Reset both the
        // ref AND the React state so a previous load's streak
        // can't leak into the topbar pill on a retry. The daily
        // branch below already does this; the streak branch was
        // missing the React state half.
        setStreak(0);
        setStreakLastDate('');
        streakStateRef.current = { days: 0, lastDate: '' };
      }

      const dd = dailyRes.data;
      const today = getTodayString();
      if (dd && dd.goal_date === today) {
        const loadedCount = dd.count || 0;
        setDailyCount(loadedCount);
        setDailyDate(today);
        dailyStateRef.current = { count: loadedCount, date: today };
      } else {
        setDailyCount(0);
        setDailyDate(today);
        dailyStateRef.current = { count: 0, date: today };
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
        dbWrite(createProgressWrite('removeLesson', { lessonKey }), 'removeLesson');
      }
    } else {
      setCompleted(prev => [...prev, lessonKey]);
      if (!skipRemote) {
        dbWrite(createProgressWrite('addLesson', { lessonKey }), 'addLesson');
      }
    }
  }, [user, completedSet, dbWrite]);

  const saveQuizScore = useCallback(async (quizKey, score) => {
    if (!user) return;
    setQuizScores(prev => ({ ...prev, [quizKey]: score }));
    dbWrite(createProgressWrite('saveQuizScore', { quizKey, score }), 'saveQuizScore');
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
      dbWrite(createProgressWrite('updateXP', { total: newTotal }), 'updateXP');
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
    // Read prior daily state from the ref, not the React closure, so two
    // calls in the same React batch don't both see the stale "before
    // either ran" value and lose an increment.
    const dailyState = dailyStateRef.current;
    const currentCount = dailyState.date === today ? dailyState.count : 0;
    const newCount = Math.min(currentCount + 1, DAILY_GOAL);
    const streakState = streakStateRef.current;

    if (streakState.lastDate !== today) {
      const nextStreakDays = streakState.lastDate === yesterday ? streakState.days + 1 : 1;
      streakStateRef.current = { days: nextStreakDays, lastDate: today };
      setStreak(nextStreakDays);
      setStreakLastDate(today);
      dbWrite(
        createProgressWrite('updateStreak', {
          days: nextStreakDays,
          lastDate: today,
        }),
        'updateStreak',
      );
    }

    dailyStateRef.current = { count: newCount, date: today };
    setDailyCount(newCount);
    setDailyDate(today);

    dbWrite(
      createProgressWrite('updateDailyGoal', {
        goalDate: today,
        count: newCount,
      }),
      'updateDailyGoal',
    );
  }, [user, dbWrite]);

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
      // dbWrite expects a createProgressWrite envelope so writes can be
      // queued + replayed by the same-browser sync queue. Match the
      // pattern used by every other dbWrite call in this file.
      dbWrite(createProgressWrite('awardBadge', { badgeId: badge.id }), `awardBadge:${badge.id}`);
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
      dbWrite(createProgressWrite('addSRCard', { card }), 'addSRCard');
    }
  }, [user, srCards, dbWrite]);

  const updateSRCard = useCallback(async (question, correct) => {
    if (!user) return;

    const currentCard = srCards.find((c) => c.question === question);
    if (!currentCard) return;

    // The SM-2-style scheduling math lives in services/srAlgorithm so
    // it's unit-testable in isolation. This callback only does state +
    // persistence.
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

  // ─── Notes (NEW) ─────────────────────────────
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

  // ─── Position ─────────────────────────────────
  const savePosition = useCallback(async (pos) => {
    if (!user) return;
    setLastPosition(prev => ({ ...prev, ...pos, time: Date.now() }));
    dbWrite(createProgressWrite('savePosition', { position: pos }), 'savePosition');
  }, [user, dbWrite]);

  // ─── Courses Visited ──────────────────────────
  const trackCourseVisit = useCallback(async (courseId) => {
    if (!user) return;
    if (coursesVisited.includes(courseId)) return;
    setCoursesVisited(prev => [...prev, courseId]);
    dbWrite(createProgressWrite('trackCourseVisit', { courseId }), 'trackCourseVisit');
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
    pendingSyncWrites,
    syncRetryInFlight,
    markSyncFailed,
    clearSyncFailed,
    enqueuePendingSyncWrite,
    retryPendingSyncWrites,
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
    pendingSyncWrites,
    syncRetryInFlight,
    markSyncFailed,
    clearSyncFailed,
    enqueuePendingSyncWrite,
    retryPendingSyncWrites,
  ]);

  // Display the streak only when it's still active. The persisted
  // value is the streak as of the learner's last activity, so a
  // learner who skipped two days would otherwise still see the
  // stale "5 day streak" pill until they did another activity. The
  // pure helper returns 0 when lastDate < yesterday.
  //
  // todayKey drives the memo invalidation so the guards recompute
  // when wall-clock time crosses UTC midnight inside an open tab.
  // Using it directly inside the helper call (instead of just as a
  // dep) keeps the date snapshot the memo captured consistent
  // through the call chain, and quiets exhaustive-deps.
  const activeStreak = useMemo(
    () => getActiveStreakDays(streak, streakLastDate, todayKey, getYesterdayString()),
    [streak, streakLastDate, todayKey],
  );
  const pausedStreak = useMemo(
    () => getPausedStreak(streak, streakLastDate, todayKey, getYesterdayString()),
    [streak, streakLastDate, todayKey],
  );
  // Display the daily count only when it matches today's date.
  // The persisted dailyCount is from the LAST day the learner did
  // activity — yesterday's "3 lessons today" would otherwise leak
  // into today's topbar and lie that the daily goal is met.
  const activeDailyCount = useMemo(
    () => getActiveDailyCount(dailyCount, dailyDate, todayKey),
    [dailyCount, dailyDate, todayKey],
  );

  const xpValue = useMemo(() => ({
    xpTotal,
    awardXP,
    xpPopup,
    clearXPPopup,
    streak: activeStreak,
    pausedStreak,
    dailyCount: activeDailyCount,
    recordDailyActivity,
    earnedBadges,
    newBadge,
    clearNewBadge,
  }), [
    xpTotal,
    awardXP,
    xpPopup,
    clearXPPopup,
    activeStreak,
    pausedStreak,
    activeDailyCount,
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
