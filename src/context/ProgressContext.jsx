// ═══════════════════════════════════════════════
// PROGRESS CONTEXT — XP, streak, badges, daily goals
// All data syncs to Supabase (cloud)
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DAILY_GOAL, TIMING, getLevel, getTodayString, getYesterdayString } from '../utils/helpers';
import * as progressService from '../services/progressService';

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
  lastPosition: null,
  savePosition: () => {},
  coursesVisited: [],
  trackCourseVisit: () => {},
  dataLoaded: false,
  loadError: null,
  retryLoad: () => {},
});

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [loadVersion, setLoadVersion] = useState(0);

  // Silent Supabase write — state is already updated optimistically.
  // If the write fails, local state is correct for the session,
  // it just won't persist until the next successful write.
  const dbWrite = useCallback(async (operation) => {
    try { await operation; } catch { /* silent — optimistic state is source of truth */ }
  }, []);

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
  const [xpPopup, setXpPopup] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

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

    const loadAll = async () => {
      const uid = user.id;
      setLoadError(null);

      try {
      // Parallel fetch all tables
      const results = await progressService.fetchAllUserData(uid);
      const { progress: progressRes, quiz: quizRes, xp: xpRes, streak: streakRes,
        daily: dailyRes, badges: badgesRes, sr: srRes, bookmarks: bookmarkRes,
        notes: notesRes, visited: visitedRes, position: posRes } = results;

      setCompleted(progressRes.data?.map(r => r.lesson_key) || []);

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
        console.error('Failed to load data:', err);
        setLoadError(err.message || 'Could not connect to database');
        setDataLoaded(true); // still mark loaded so UI isn't stuck
      }
    };

    loadAll();
  }, [user, loadVersion, resetUserState]);

  // ─── Streak check on load ─────────────────────
  useEffect(() => {
    if (!user || !dataLoaded) return;
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

    dbWrite(progressService.updateStreak(user.id, newDays, today));
  }, [user, dataLoaded, streakLastDate, streak, dbWrite]);

  // ─── Progress ─────────────────────────────────
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const toggleLesson = useCallback(async (lessonKey) => {
    if (!user) return;
    const has = completedSet.has(lessonKey);

    if (has) {
      setCompleted(prev => prev.filter(k => k !== lessonKey));
      dbWrite(progressService.removeLesson(user.id, lessonKey));
    } else {
      setCompleted(prev => [...prev, lessonKey]);
      dbWrite(progressService.addLesson(user.id, lessonKey));
    }
  }, [user, completedSet]);

  const saveQuizScore = useCallback(async (quizKey, score) => {
    if (!user) return;
    setQuizScores(prev => ({ ...prev, [quizKey]: score }));
    dbWrite(progressService.saveQuizScore(user.id, quizKey, score));
  }, [user]);

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

    dbWrite(progressService.updateXP(user.id, newTotal));
  }, [user, xpTotal]);

  const clearXPPopup = useCallback(() => setXpPopup(null), []);

  // ─── Daily Goal ───────────────────────────────
  const recordDailyActivity = useCallback(async () => {
    if (!user) return;
    const today = getTodayString();
    const currentCount = dailyDate === today ? dailyCount : 0;
    const newCount = Math.min(currentCount + 1, DAILY_GOAL);

    setDailyCount(newCount);
    setDailyDate(today);

    dbWrite(progressService.updateDailyGoal(user.id, today, newCount));
  }, [user, dailyCount, dailyDate]);

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

        dbWrite(progressService.awardBadge(user.id, b.id));
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
      dbWrite(progressService.addSRCard(user.id, card));
    }
  }, [user, srCards]);

  const updateSRCard = useCallback(async (question, correct) => {
    if (!user) return;

    setSrCards(prev => prev.map(card => {
      if (card.question !== question) return card;
      if (correct) {
        const newInterval = Math.round(card.interval * card.ease);
        return {
          ...card,
          interval: newInterval,
          ease: Math.min(card.ease + 0.1, 3.0),
          nextReview: Date.now() + newInterval * TIMING.dayMs,
        };
      } else {
        return {
          ...card,
          interval: 1,
          ease: Math.max(card.ease - 0.2, 1.3),
          nextReview: Date.now() + TIMING.dayMs,
        };
      }
    }));

    // Find the updated card to sync
    const card = srCards.find(c => c.question === question);
    if (!card) return;

    const newInterval = correct ? Math.round(card.interval * card.ease) : 1;
    const newEase = correct ? Math.min(card.ease + 0.1, 3.0) : Math.max(card.ease - 0.2, 1.3);
    const nextReview = new Date(Date.now() + (correct ? newInterval : 1) * TIMING.dayMs);

    dbWrite(progressService.updateSRCard(user.id, question, { next_review: nextReview.toISOString(), interval_days: newInterval, ease: newEase }));
  }, [user, srCards, dbWrite]);

  const getDueSRCards = useCallback(() => {
    return srCards.filter(c => c.nextReview <= Date.now());
  }, [srCards]);

  // ─── Bookmarks (NEW) ─────────────────────────
  const toggleBookmark = useCallback(async (lessonKey, courseId, lessonTitle) => {
    if (!user) return;
    const existing = bookmarks.find(b => b.lesson_key === lessonKey);

    if (existing) {
      setBookmarks(prev => prev.filter(b => b.lesson_key !== lessonKey));
      dbWrite(progressService.removeBookmark(user.id, lessonKey));
    } else {
      const newBookmark = { lesson_key: lessonKey, course_id: courseId, lesson_title: lessonTitle, created_at: new Date().toISOString() };
      setBookmarks(prev => [...prev, newBookmark]);
      dbWrite(progressService.addBookmark(user.id, { lessonKey, courseId, lessonTitle }));
    }
  }, [user, bookmarks, dbWrite]);

  const isBookmarked = useCallback((lessonKey) => {
    return bookmarks.some(b => b.lesson_key === lessonKey);
  }, [bookmarks]);

  // ─── Notes (NEW) ─────────────────────────────
  const saveNote = useCallback(async (lessonKey, content) => {
    if (!user) return;
    setNotes(prev => ({ ...prev, [lessonKey]: content }));
    dbWrite(progressService.saveNote(user.id, lessonKey, content));
  }, [user]);

  const getNote = useCallback((lessonKey) => {
    return notes[lessonKey] || '';
  }, [notes]);

  // ─── Position ─────────────────────────────────
  const savePosition = useCallback(async (pos) => {
    if (!user) return;
    setLastPosition(prev => ({ ...prev, ...pos, time: Date.now() }));
    dbWrite(progressService.savePosition(user.id, pos));
  }, [user, dbWrite]);

  // ─── Courses Visited ──────────────────────────
  const trackCourseVisit = useCallback(async (courseId) => {
    if (!user) return;
    if (coursesVisited.includes(courseId)) return;
    setCoursesVisited(prev => [...prev, courseId]);
    dbWrite(progressService.trackCourseVisit(user.id, courseId));
  }, [user, coursesVisited, dbWrite]);

  const retryLoad = useCallback(() => {
    setDataLoaded(false);
    setLoadError(null);
    setLoadVersion((version) => version + 1);
  }, []);

  const value = useMemo(() => ({
    // Progress
    completed, completedSet, toggleLesson, quizScores, saveQuizScore,
    // XP
    xpTotal, awardXP, xpPopup, clearXPPopup,
    // Streak & Daily
    streak, dailyCount, recordDailyActivity,
    // Badges
    earnedBadges, newBadge, clearNewBadge,
    // SR
    srCards, addToSRQueue, updateSRCard, getDueSRCards,
    // Bookmarks & Notes
    bookmarks, toggleBookmark, isBookmarked,
    notes, saveNote, getNote,
    // Position & Visits
    lastPosition, savePosition, coursesVisited, trackCourseVisit,
    // State
    dataLoaded, loadError, retryLoad,
  }), [
    completed, completedSet, toggleLesson, quizScores, saveQuizScore,
    xpTotal, awardXP, xpPopup, clearXPPopup,
    streak, dailyCount, recordDailyActivity,
    earnedBadges, newBadge, clearNewBadge,
    srCards, addToSRQueue, updateSRCard, getDueSRCards,
    bookmarks, toggleBookmark, isBookmarked,
    notes, saveNote, getNote,
    lastPosition, savePosition, coursesVisited, trackCourseVisit,
    dataLoaded, loadError, retryLoad,
  ]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
