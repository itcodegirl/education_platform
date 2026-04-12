// ═══════════════════════════════════════════════
// ADMIN STATS — Pure functions that derive the
// dashboard metrics from raw Supabase query results.
// Kept isolated from React so the math is easy to
// unit-test and reuse across tabs.
// ═══════════════════════════════════════════════

import { COURSES } from '../../data';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function computeAdminStats(data, now = new Date()) {
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const monthAgo = new Date(now.getTime() - MONTH_MS);

  const totalUsers = data.users.length;
  const newUsersWeek = data.users.filter(u => new Date(u.created_at) > weekAgo).length;
  const newUsersMonth = data.users.filter(u => new Date(u.created_at) > monthAgo).length;

  const totalCompletions = data.progress.length;
  const activeUsers = new Set(
    data.progress.filter(p => new Date(p.completed_at) > weekAgo).map(p => p.user_id),
  ).size;

  return { totalUsers, newUsersWeek, newUsersMonth, totalCompletions, activeUsers };
}

export function computeCourseStats(data) {
  return COURSES.map(course => {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const courseProgress = data.progress.filter(p => p.lesson_key.startsWith(course.label));
    const uniqueUsers = new Set(courseProgress.map(p => p.user_id)).size;

    // Users who completed ALL lessons in this course
    const userLessonCounts = {};
    courseProgress.forEach(p => {
      userLessonCounts[p.user_id] = (userLessonCounts[p.user_id] || 0) + 1;
    });
    const completedUsers = Object.values(userLessonCounts).filter(c => c >= totalLessons).length;

    // Per-lesson completion counts (used by Courses tab)
    const lessonCounts = {};
    courseProgress.forEach(p => {
      lessonCounts[p.lesson_key] = (lessonCounts[p.lesson_key] || 0) + 1;
    });

    return {
      ...course,
      totalLessons,
      uniqueUsers,
      completedUsers,
      totalCompletions: courseProgress.length,
      avgProgress: uniqueUsers > 0
        ? Math.round((courseProgress.length / uniqueUsers / totalLessons) * 100)
        : 0,
      lessonCounts,
    };
  });
}

export function computeTopUsers(data, limit = 10) {
  return [...data.xp]
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, limit)
    .map(x => {
      const profile = data.users.find(u => u.id === x.user_id);
      return { ...x, name: profile?.display_name || 'Anonymous' };
    });
}

export function computeQuizStats(data) {
  const stats = {};
  data.quizScores.forEach(qs => {
    if (!stats[qs.quiz_key]) stats[qs.quiz_key] = { attempts: 0, scores: [] };
    stats[qs.quiz_key].attempts += 1;
    const [got, total] = (qs.score || '0/0').split('/').map(Number);
    if (total > 0) stats[qs.quiz_key].scores.push(got / total);
  });
  return stats;
}
