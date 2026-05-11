// ═══════════════════════════════════════════════
// PROGRESS CONTEXT — XP, streak, badges, daily goals
// Account progress syncs to Supabase when reachable; a same-browser
// retry queue preserves optimistic writes until cloud confirmation.
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { buildNotesMap } from './progressSavedLessonHelpers';
import { createEmptyLastPosition, mapLastPositionRow } from './lastPositionState';
import { collectRecoverableLoadWarnings } from './progressSyncWarningHelpers';
import {
  getActiveDailyCount,
  getActiveStreakDays,
  getLevel,
  getPausedStreak,
  getTodayString,
  getYesterdayString,
} from '../utils/helpers';
import * as progressService from '../services/progressService';
import { createProgressWrite } from '../services/progressWriteQueue';
import { isPerfectQuizScore, isQuizScoreValueImprovement, rewardKeys } from '../services/rewardPolicy';
import { useTodayKey } from '../hooks/useTodayKey';
import { useProgressSync } from '../hooks/useProgressSync';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { useBookmarks } from '../hooks/useBookmarks';
import { useNotes } from '../hooks/useNotes';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { useLearnerRewards } from '../hooks/useLearnerRewards';
import { findNewlyEarnedBadges } from '../services/badgeRules';
import {
  readChallengeCompletions,
  readRewardHistory,
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
  loadWarnings: [],
  retryLoad: () => {},
  clearLoadWarnings: () => {},
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

function normalizeCompletedLessonKey(lessonKey) {
  if (typeof lessonKey !== 'string' || !lessonKey.trim()) return '';
  return normalizeProgressLessonKey(lessonKey.trim());
}

function normalizeCompletedLessonKeys(lessonKeys = []) {
  return normalizeStringSet(
    (Array.isArray(lessonKeys) ? lessonKeys : [])
      .map(normalizeCompletedLessonKey)
      .filter(Boolean),
  );
}

function getEquivalentCompletedLessonKeys(completedKeys = [], rawLessonKey = '') {
  const normalizedTarget = normalizeCompletedLessonKey(rawLessonKey);
  if (!normalizedTarget) return [];

  return (Array.isArray(completedKeys) ? completedKeys : []).filter((completedKey) =>
    normalizeCompletedLessonKey(completedKey) === normalizedTarget,
  );
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

  // ─── State ─────────────────────────────────────
  const [completed, setCompleted] = useState([]);
  const completedRef = useRef(new Set());
  const [quizScores, setQuizScores] = useState({});
  const quizScoresRef = useRef({});
  const [xpTotal, setXpTotal] = useState(0);
  const xpTotalRef = useRef(0);
  const xpWriteChainRef = useRef(Promise.resolve());
  const [earnedBadges, setEarnedBadges] = useState({});
  const [coursesVisited, setCoursesVisited] = useState([]);
  const [lastPosition, setLastPosition] = useState(createEmptyLastPosition);
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
  const [loadWarnings, setLoadWarnings] = useState([]);
  const clearLoadWarnings = useCallback(() => setLoadWarnings([]), [setLoadWarnings]);

  // Cloud-write retry surface lives in useProgressSync — pendingSyncWrites,
  // syncFailed, dbWrite, queue replay, online-listener, etc. The hook
  // also owns the session-replay-on-load lifecycle; we hand it a
  // callback so a successful retry can bump the data-loader version
  // and re-hydrate canonical state.
  const handleReloadAfterRetry = useCallback(() => {
    setLoadVersion((version) => version + 1);
  }, []);

  const {
    syncFailed,
    pendingSyncWrites,
    syncRetryInFlight,
    markSyncFailed,
    clearSyncFailed,
    enqueuePendingSyncWrite,
    dbWrite,
    retryPendingSyncWrites,
    setSyncFailed,
  } = useProgressSync({
    userId,
    dataLoaded,
    loadError,
    onReloadAfterRetry: handleReloadAfterRetry,
  });

  // Spaced-repetition card state lives in useReviewQueue — addToSRQueue,
  // updateSRCard, getDueSRCards, replaceCards (hydration setter for the
  // data load), resetCards (sign-out reset).
  const {
    srCards,
    addToSRQueue,
    updateSRCard,
    getDueSRCards,
    replaceCards: replaceSRCards,
    resetCards: resetSRCards,
  } = useReviewQueue({ user, dbWrite, createProgressWrite });

  // Bookmarks + notes have the same shape as SR cards: state +
  // ref-mirror + dbWrite via per-resource serialization. Each hook
  // exposes a replace<X> hydration setter that the data-load effect
  // calls once on hydration, and a reset<X> setter for sign-out.
  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    replaceBookmarks,
    resetBookmarks,
  } = useBookmarks({ user, dbWrite, createProgressWrite });

  const {
    notes,
    saveNote,
    getNote,
    replaceNotes,
    resetNotes,
  } = useNotes({ user, dbWrite, createProgressWrite });

  // Streak + daily-goal state lives in useDailyActivity. The provider
  // still owns the wall-clock guards (active vs paused streak) below
  // because they depend on todayKey and only matter at render time.
  const {
    streak,
    streakLastDate,
    dailyCount,
    dailyDate,
    recordDailyActivity,
    replaceStreak,
    replaceDailyGoal,
    resetStreakAndDaily,
  } = useDailyActivity({ user, dbWrite, createProgressWrite });

  // Reward dedup + challenge-completion dedup live in their own
  // hook. Both are localStorage-backed today and route their write
  // failures through markSyncFailed so the UI banner counts them
  // alongside cloud-write failures.
  const {
    rewardHistory,
    hasRewardBeenAwarded,
    markRewardAwarded,
    challengeCompletions,
    isChallengeCompleted,
    markChallengeCompleted,
    replaceRewardHistory,
    replaceChallengeCompletions,
    resetLearnerRewards,
  } = useLearnerRewards({ user, markSyncFailed });

  const resetUserState = useCallback(() => {
    completedRef.current = new Set();
    setCompleted([]);
    setQuizScores({});
    quizScoresRef.current = {};
    xpTotalRef.current = 0;
    xpWriteChainRef.current = Promise.resolve();
    setXpTotal(0);
    resetStreakAndDaily();
    setEarnedBadges({});
    resetSRCards();
    resetBookmarks();
    resetNotes();
    setCoursesVisited([]);
    setLastPosition(createEmptyLastPosition());
    resetLearnerRewards();
    setXpPopupQueue([]);
    setNewBadgeQueue([]);
  }, [
    resetSRCards,
    resetBookmarks,
    resetNotes,
    resetStreakAndDaily,
    resetLearnerRewards,
  ]);

  // ─── Load all data from Supabase on login ──────
  useEffect(() => {
    if (!user) {
      resetUserState();
      setDataLoaded(false);
      setLoadError(null);
      setLoadWarnings([]);
      return;
    }

    let cancelled = false;

    const loadAll = async () => {
      const uid = user.id;
      setLoadError(null);
      setLoadWarnings([]);

      try {
      // Parallel fetch all tables
      const results = await progressService.fetchAllUserData(uid);
      if (cancelled) return;
      if (results.criticalError) {
        throw new Error(results.criticalError.message);
      }

      setLoadWarnings(collectRecoverableLoadWarnings(results.recoverableErrors));

      const { progress, quiz, xp, streak, daily, badges: badgeRows, sr, bookmarks: bookmarkRows,
        notes: noteRows, visited, position } = results.data;

      const completedLessonKeys = normalizeCompletedLessonKeys(progress.map(r => r.lesson_key));
      completedRef.current = new Set(completedLessonKeys);
      setCompleted(completedLessonKeys);

      const scores = {};
      quiz.forEach(r => { scores[r.quiz_key] = r.score; });
      quizScoresRef.current = scores;
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

      const loadedXpTotal = xp?.total || 0;
      xpTotalRef.current = loadedXpTotal;
      setXpTotal(loadedXpTotal);

      const sd = streak;
      if (sd) {
        replaceStreak(sd.days || 0, sd.last_date || '');
      } else {
        // No streak row exists for this user yet. replaceStreak
        // resets both the React state and the ref so a previous
        // load's streak cannot leak into the topbar pill.
        replaceStreak(0, '');
      }

      const dd = daily;
      const today = getTodayString();
      if (dd && dd.goal_date === today) {
        replaceDailyGoal(dd.count || 0, today);
      } else {
        replaceDailyGoal(0, today);
      }

      const loadedBadges = {};
      badgeRows.forEach(r => { loadedBadges[r.badge_id] = { date: r.earned_at?.slice(0, 10) }; });
      setEarnedBadges(loadedBadges);

      replaceSRCards(sr.map(r => ({
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
      })));

      replaceBookmarks(bookmarkRows);

      replaceNotes(buildNotesMap(noteRows));

      setCoursesVisited(visited.map(r => r.course_id));

      setLastPosition(mapLastPositionRow(position));

      setDataLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load data:', err);
        setLoadWarnings([]);
        setLoadError(err.message || 'Could not connect to database');
        setDataLoaded(true); // still mark loaded so UI isn't stuck
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    loadVersion,
    resetUserState,
    replaceRewardHistory,
    replaceChallengeCompletions,
    replaceSRCards,
    replaceBookmarks,
    replaceNotes,
    replaceStreak,
    replaceDailyGoal,
  ]);

  // ─── Progress ─────────────────────────────────
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const toggleLesson = useCallback(async (lessonKey, options = {}) => {
    if (!user) return;
    const normalizedLessonKey = typeof lessonKey === 'string' ? lessonKey.trim() : '';
    if (!normalizedLessonKey) return;
    const skipRemote = Boolean(options?.skipRemote);
    const has = completedSet.has(normalizedLessonKey);
    // Serialize concurrent toggles for the SAME lesson so an
    // addLesson → removeLesson → addLesson sequence lands in the
    // submitted order on the server. Toggles for different lessons
    // still run in parallel.
    const resourceKey = `lesson:${normalizedLessonKey}`;

    if (has) {
      setCompleted(prev => prev.filter(k => k !== normalizedLessonKey));
      if (!skipRemote) {
        dbWrite(
          createProgressWrite('removeLesson', { lessonKey: normalizedLessonKey }),
          'removeLesson',
          { resourceKey },
        );
      }
    } else {
      setCompleted(prev => {
        if (prev.includes(normalizedLessonKey)) return prev;
        return [...prev, normalizedLessonKey];
      });
      if (!skipRemote) {
        dbWrite(
          createProgressWrite('addLesson', { lessonKey: normalizedLessonKey }),
          'addLesson',
          { resourceKey },
        );
      }
    }
  }, [user, dbWrite]);

  const saveQuizScore = useCallback(async (quizKey, score) => {
    if (!user) return;
    const normalizedQuizKey = typeof quizKey === 'string' ? quizKey.trim() : '';
    if (!normalizedQuizKey) return;

    const currentScore = quizScoresRef.current[normalizedQuizKey];
    if (!isQuizScoreValueImprovement(currentScore, score)) {
      return;
    }

    const nextScores = { ...quizScoresRef.current, [normalizedQuizKey]: score };
    quizScoresRef.current = nextScores;
    setQuizScores(nextScores);
    dbWrite(
      createProgressWrite('saveQuizScore', { quizKey: normalizedQuizKey, score }),
      'saveQuizScore',
      { resourceKey: `quiz:${normalizedQuizKey}` },
    );
  }, [user, dbWrite]);

  // ─── XP ───────────────────────────────────────
  const awardXP = useCallback(async (amount, reason, options = {}) => {
    if (!user) return;
    const skipRemote = Boolean(options?.skipRemote);
    const oldTotal = xpTotalRef.current;
    const oldLevel = getLevel(oldTotal);
    const newTotal = oldTotal + amount;
    const newLevel = getLevel(newTotal);

    xpTotalRef.current = newTotal;
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
      const write = createProgressWrite('updateXP', { total: newTotal });
      xpWriteChainRef.current = xpWriteChainRef.current
        .catch(() => {})
        .then(() => dbWrite(write, 'updateXP'));
      await xpWriteChainRef.current;
    }
  }, [user, dbWrite]);

  // Shifts the currently-displayed popup off the queue. If more popups
  // are queued, the next one becomes the new head and renders next.
  const clearXPPopup = useCallback(() => {
    setXpPopupQueue((queue) => (queue.length > 0 ? queue.slice(1) : queue));
  }, []);

  // Reward dedup + challenge completion are owned by useLearnerRewards above.

  // Streak + daily-goal increment is owned by useDailyActivity above.

  // ─── Badges ───────────────────────────────────
  // The pure rules (which conditions earn which badge) live in
  // services/badgeRules.js. This callback's only job is to build a
  // context snapshot from current state, ask findNewlyEarnedBadges
  // what's freshly earned, and then persist + celebrate it.
  //
  // Primitives are derived once per state change so the callback +
  // effect deps never touch unstable object identities (quizScores,
  // notes, bookmarks, earnedBadges). Without this guard, a single
  // note save creates a new `notes` object → effect refires →
  // checkBadges reruns even when no badge-relevant input moved.
  const completedCount = completed.length;
  const quizCount = useMemo(() => Object.keys(quizScores).length, [quizScores]);
  const hasPerfectQuiz = useMemo(
    () => Object.values(quizScores).some((v) => {
      const [a, b] = typeof v === 'string' ? v.split('/') : [];
      return a === b && parseInt(a, 10) > 0;
    }),
    [quizScores],
  );
  const coursesVisitedCount = coursesVisited.length;
  const bookmarkCount = bookmarks.length;
  const noteCount = useMemo(() => Object.keys(notes).length, [notes]);
  const earnedBadgesRef = useRef(earnedBadges);
  useEffect(() => {
    earnedBadgesRef.current = earnedBadges;
  }, [earnedBadges]);

  const checkBadges = useCallback(async () => {
    if (!user) return;

    const ctx = {
      completedCount,
      quizCount,
      hasPerfect: hasPerfectQuiz,
      xpTotal,
      streak,
      coursesVisitedCount,
      dailyCount: dailyDate === getTodayString() ? dailyCount : 0,
      hour: new Date().getHours(),
      bookmarkCount,
      noteCount,
    };

    const currentEarnedBadges = earnedBadgesRef.current;
    const newlyEarned = findNewlyEarnedBadges(ctx, currentEarnedBadges);
    if (newlyEarned.length === 0) return;

    const updated = { ...currentEarnedBadges };
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
  }, [
    user,
    completedCount,
    quizCount,
    hasPerfectQuiz,
    xpTotal,
    streak,
    coursesVisitedCount,
    dailyCount,
    dailyDate,
    bookmarkCount,
    noteCount,
    dbWrite,
  ]);

  useEffect(() => {
    if (dataLoaded) checkBadges();
  }, [dataLoaded, checkBadges]);

  const clearNewBadge = useCallback(() => {
    setNewBadgeQueue((queue) => (queue.length > 0 ? queue.slice(1) : queue));
  }, []);

  // ─── Position ─────────────────────────────────
  const savePosition = useCallback(async (pos) => {
    if (!user) return;
    setLastPosition(prev => ({ ...prev, ...pos, time: Date.now() }));
    // Position is single-row per learner; serializing means a faster
    // navigation never overwrites a slower one with stale "previous"
    // coordinates.
    dbWrite(
      createProgressWrite('savePosition', { position: pos }),
      'savePosition',
      { resourceKey: 'last-position' },
    );
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
    setLoadWarnings([]);
    // A fresh load replaces optimistic state with canonical DB state,
    // so any stale "sync failed" counter is irrelevant after this.
    setSyncFailed(0);
    setLoadVersion((version) => version + 1);
  }, [setLoadWarnings, setSyncFailed]);

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
    loadWarnings,
    retryLoad,
    clearLoadWarnings,
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
    loadWarnings,
    retryLoad,
    clearLoadWarnings,
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
