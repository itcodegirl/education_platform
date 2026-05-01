// ═══════════════════════════════════════════════
// PROGRESS SERVICE — All Supabase data operations
// Context calls these; this file owns the DB logic.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';
import { parseQuizScore } from './rewardPolicy';

const QUIZ_SCORE_CONFLICT_TARGET = 'user_id,quiz_key';
const QUIZ_SCORE_DEBUG_KEYS = Object.freeze([
  'debug-quiz-score-save',
  'debug-reward-sync',
]);

function isQuizScoreDebugEnabled(storage = globalThis.localStorage) {
  try {
    return QUIZ_SCORE_DEBUG_KEYS.some((key) => storage?.getItem(key) === 'true');
  } catch {
    return false;
  }
}

function emitQuizScoreDiagnostic(detail, options = {}) {
  const debugEnabled = options.debugEnabled ?? isQuizScoreDebugEnabled(options.storage);
  if (!debugEnabled) return null;

  const diagnostic = {
    phase: detail.phase || 'unknown',
    attempted: Boolean(detail.attempted),
    upsertUsed: Boolean(detail.upsertUsed),
    conflictHandled: Boolean(detail.conflictHandled),
    finalResult: detail.finalResult || null,
    quizKey: typeof detail.quizKey === 'string' ? detail.quizKey : null,
    reason: typeof detail.reason === 'string' ? detail.reason : null,
    errorMessage: typeof detail.errorMessage === 'string' ? detail.errorMessage : null,
  };
  const logger = options.logger || console;
  if (logger?.info) {
    logger.info('[CodeHerWay] quiz score save', diagnostic);
  }

  return diagnostic;
}

function getErrorMessage(error) {
  if (!error) return null;
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  if (typeof error.details === 'string' && error.details.trim()) return error.details.trim();
  return null;
}

function isConflictError(error) {
  if (!error) return false;
  const status = Number(error.status || error.code);
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return status === 409 ||
    error.code === '23505' ||
    message.includes('duplicate key') ||
    message.includes('unique constraint') ||
    message.includes('conflict');
}

function compareQuizScores(currentScoreValue, nextScoreValue) {
  const current = parseQuizScore(currentScoreValue);
  const next = parseQuizScore(nextScoreValue);

  if (current && next) {
    if (next.pct !== current.pct) return next.pct - current.pct;
    return next.score - current.score;
  }

  if (!current && next) return 1;
  if (current && !next) return -1;

  const currentNumber = Number(currentScoreValue);
  const nextNumber = Number(nextScoreValue);
  if (Number.isFinite(currentNumber) && Number.isFinite(nextNumber)) {
    return nextNumber - currentNumber;
  }

  return String(nextScoreValue || '').localeCompare(String(currentScoreValue || ''));
}

function createQuizScorePayload(uid, quizKey, score) {
  return {
    user_id: uid,
    quiz_key: quizKey,
    score,
    completed_at: new Date().toISOString(),
  };
}

// ─── Fetch all user data on login ───────────
export async function fetchAllUserData(uid) {
  const [
    progressRes,
    quizRes,
    xpRes,
    streakRes,
    dailyRes,
    badgesRes,
    srRes,
    bookmarksRes,
    notesRes,
    visitedRes,
    posRes,
  ] = await Promise.all([
    supabase.from('progress').select('lesson_key').eq('user_id', uid),
    supabase.from('quiz_scores').select('quiz_key, score').eq('user_id', uid),
    supabase.from('xp').select('total').eq('user_id', uid).maybeSingle(),
    supabase
      .from('streaks')
      .select('days, last_date')
      .eq('user_id', uid)
      .maybeSingle(),
    supabase
      .from('daily_goals')
      .select('goal_date, count')
      .eq('user_id', uid)
      .maybeSingle(),
    supabase.from('badges').select('badge_id, earned_at').eq('user_id', uid),
    supabase.from('sr_cards').select('*').eq('user_id', uid),
    supabase.from('bookmarks').select('*').eq('user_id', uid),
    supabase.from('notes').select('lesson_key, content').eq('user_id', uid),
    supabase.from('courses_visited').select('course_id').eq('user_id', uid),
    supabase
      .from('last_position')
      .select('course, mod, les, updated_at')
      .eq('user_id', uid)
      .maybeSingle(),
  ]);

  const errors = [
    ['progress', progressRes.error],
    ['quiz_scores', quizRes.error],
    ['xp', xpRes.error],
    ['streaks', streakRes.error],
    ['daily_goals', dailyRes.error],
    ['badges', badgesRes.error],
    ['sr_cards', srRes.error],
    ['bookmarks', bookmarksRes.error],
    ['notes', notesRes.error],
    ['courses_visited', visitedRes.error],
    ['last_position', posRes.error],
        ].filter(([, error]) => !!error);

  if (errors.length > 0) {
    const details = errors
      .map(([source, error]) => `${source}: ${error?.message || 'Unknown error'}`)
      .join(' | ');
    throw new Error(`Failed to load user data (${details})`);
  }

  return {
    progress: progressRes,
    quiz: quizRes,
    xp: xpRes,
    streak: streakRes,
    daily: dailyRes,
    badges: badgesRes,
    sr: srRes,
    bookmarks: bookmarksRes,
    notes: notesRes,
    visited: visitedRes,
    position: posRes,
  };
}

// ─── Progress (lessons) ─────────────────────
export function addLesson(uid, lessonKey) {
  return supabase
    .from('progress')
    .upsert({ user_id: uid, lesson_key: lessonKey });
}

export function removeLesson(uid, lessonKey) {
  return supabase
    .from('progress')
    .delete()
    .eq('user_id', uid)
    .eq('lesson_key', lessonKey);
}

export function removeLessonsByKeys(uid, lessonKeys) {
  const normalizedLessonKeys = Array.from(
    new Set(
      Array.isArray(lessonKeys)
        ? lessonKeys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim())
        : [],
    ),
  );

  return supabase
    .from('progress')
    .delete()
    .eq('user_id', uid)
    .in('lesson_key', normalizedLessonKeys);
}

// ─── Quiz Scores ────────────────────────────
export async function saveQuizScore(uid, quizKey, score, options = {}) {
  const payload = createQuizScorePayload(uid, quizKey, score);
  emitQuizScoreDiagnostic({
    phase: 'attempted',
    attempted: true,
    upsertUsed: true,
    conflictHandled: false,
    finalResult: 'pending',
    quizKey,
  }, options);

  const upsertResult = await supabase.from('quiz_scores').upsert(payload, {
    onConflict: QUIZ_SCORE_CONFLICT_TARGET,
    ignoreDuplicates: false,
  });

  if (!upsertResult?.error) {
    emitQuizScoreDiagnostic({
      phase: 'final',
      attempted: true,
      upsertUsed: true,
      conflictHandled: false,
      finalResult: 'saved',
      quizKey,
    }, options);
    return {
      ...upsertResult,
      conflictHandled: false,
      skipped: false,
    };
  }

  if (!isConflictError(upsertResult.error)) {
    emitQuizScoreDiagnostic({
      phase: 'final',
      attempted: true,
      upsertUsed: true,
      conflictHandled: false,
      finalResult: 'failed',
      quizKey,
      errorMessage: getErrorMessage(upsertResult.error),
    }, options);
    return upsertResult;
  }

  const existingResult = await supabase
    .from('quiz_scores')
    .select('score')
    .eq('user_id', uid)
    .eq('quiz_key', quizKey)
    .maybeSingle();

  if (existingResult?.error) {
    emitQuizScoreDiagnostic({
      phase: 'final',
      attempted: true,
      upsertUsed: true,
      conflictHandled: true,
      finalResult: 'failed',
      quizKey,
      reason: 'conflict_read_failed',
      errorMessage: getErrorMessage(existingResult.error),
    }, options);
    return existingResult;
  }

  const existingScore = existingResult?.data?.score;
  if (existingScore && compareQuizScores(existingScore, score) <= 0) {
    emitQuizScoreDiagnostic({
      phase: 'final',
      attempted: true,
      upsertUsed: true,
      conflictHandled: true,
      finalResult: 'skipped_existing_best',
      quizKey,
    }, options);
    return {
      data: existingResult.data,
      error: null,
      conflictHandled: true,
      skipped: true,
    };
  }

  const updateResult = await supabase
    .from('quiz_scores')
    .update({
      score,
      completed_at: payload.completed_at,
    })
    .eq('user_id', uid)
    .eq('quiz_key', quizKey);

  emitQuizScoreDiagnostic({
    phase: 'final',
    attempted: true,
    upsertUsed: true,
    conflictHandled: true,
    finalResult: updateResult?.error ? 'failed' : 'updated_existing',
    quizKey,
    errorMessage: getErrorMessage(updateResult?.error),
  }, options);

  return {
    ...updateResult,
    conflictHandled: true,
    skipped: false,
  };
}

// ─── XP ─────────────────────────────────────
export function updateXP(uid, total) {
  return supabase.from('xp').upsert({
    user_id: uid,
    total,
    updated_at: new Date().toISOString(),
  });
}

// ─── Streaks ────────────────────────────────
export function updateStreak(uid, days, lastDate) {
  return supabase.from('streaks').upsert({
    user_id: uid,
    days,
    last_date: lastDate,
    updated_at: new Date().toISOString(),
  });
}

// ─── Daily Goals ────────────────────────────
export function updateDailyGoal(uid, goalDate, count) {
  return supabase.from('daily_goals').upsert({
    user_id: uid,
    goal_date: goalDate,
    count,
    updated_at: new Date().toISOString(),
  });
}

// ─── Badges ─────────────────────────────────
export function awardBadge(uid, badgeId) {
  return supabase.from('badges').upsert({
    user_id: uid,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  });
}

// ─── Spaced Repetition ──────────────────────
export function addSRCard(uid, card) {
  return supabase.from('sr_cards').upsert({
    user_id: uid,
    question: card.question,
    code: card.code || null,
    options: card.options,
    correct: card.correct,
    explanation: card.explanation,
    source: card.source,
  });
}

export function updateSRCard(
  uid,
  question,
  updates,
) {
  return supabase
    .from('sr_cards')
    .update({ ...updates })
    .eq('user_id', uid)
    .eq('question', question);
}

// ─── Bookmarks ──────────────────────────────
export function addBookmark(uid, bookmark) {
  return supabase.from('bookmarks').upsert({
    user_id: uid,
    lesson_key: bookmark.lessonKey,
    course_id: bookmark.courseId,
    lesson_title: bookmark.lessonTitle,
  });
}

export function removeBookmark(uid, lessonKey) {
  return supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', uid)
    .eq('lesson_key', lessonKey);
}

export function removeBookmarksByKeys(uid, lessonKeys) {
  const normalizedLessonKeys = Array.from(
    new Set(
      Array.isArray(lessonKeys)
        ? lessonKeys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim())
        : [],
    ),
  );

  return supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', uid)
    .in('lesson_key', normalizedLessonKeys);
}

// ─── Notes ──────────────────────────────────
export function saveNote(uid, lessonKey, content) {
  return supabase.from('notes').upsert({
    user_id: uid,
    lesson_key: lessonKey,
    content,
    updated_at: new Date().toISOString(),
  });
}

// ─── Position ───────────────────────────────
export function savePosition(uid, position) {
  return supabase.from('last_position').upsert({
    user_id: uid,
    course: position.course,
    mod: position.mod,
    les: position.les,
    updated_at: new Date().toISOString(),
  });
}

// ─── Course Visits ──────────────────────────
export function trackCourseVisit(uid, courseId) {
  return supabase.from('courses_visited').upsert({
    user_id: uid,
    course_id: courseId,
    visited_at: new Date().toISOString(),
  });
}
