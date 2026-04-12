// ═══════════════════════════════════════════════
// ADMIN STATS TESTS — Locks down the dashboard
// math so the Admin tabs can be refactored freely
// without silently breaking the numbers admins see.
// ═══════════════════════════════════════════════

import { describe, test, expect, vi } from 'vitest';

// Stub COURSES before loading adminStats so the fixture is deterministic.
vi.mock('../../src/data', () => ({
  COURSES: [
    {
      id: 'html',
      label: 'HTML',
      icon: '🟧',
      accent: '#f59e0b',
      modules: [
        {
          title: 'Basics',
          emoji: '🧱',
          lessons: [
            { title: 'Tags' },
            { title: 'Attributes' },
          ],
        },
      ],
    },
  ],
}));

const {
  computeAdminStats,
  computeCourseStats,
  computeTopUsers,
  computeQuizStats,
} = await import('../../src/components/admin/adminStats.js');

const NOW = new Date('2026-04-12T12:00:00Z');
const FIVE_DAYS_AGO = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
const TWENTY_DAYS_AGO = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
const SIXTY_DAYS_AGO = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

const data = {
  users: [
    { id: 'u1', display_name: 'Alice', created_at: FIVE_DAYS_AGO },
    { id: 'u2', display_name: 'Bob', created_at: TWENTY_DAYS_AGO },
    { id: 'u3', display_name: 'Carol', created_at: SIXTY_DAYS_AGO },
  ],
  progress: [
    { user_id: 'u1', lesson_key: 'HTML|Basics|Tags', completed_at: FIVE_DAYS_AGO },
    { user_id: 'u1', lesson_key: 'HTML|Basics|Attributes', completed_at: FIVE_DAYS_AGO },
    { user_id: 'u2', lesson_key: 'HTML|Basics|Tags', completed_at: TWENTY_DAYS_AGO },
  ],
  quizScores: [
    { user_id: 'u1', quiz_key: 'html-basics', score: '4/5' },
    { user_id: 'u2', quiz_key: 'html-basics', score: '3/5' },
    { user_id: 'u3', quiz_key: 'html-basics', score: '0/0' }, // divide-by-zero guard
  ],
  xp: [
    { user_id: 'u1', total: 1200 },
    { user_id: 'u2', total: 400 },
    { user_id: 'u3', total: 50 },
  ],
  streaks: [],
  badges: [],
};

describe('computeAdminStats', () => {
  test('counts new-this-week correctly', () => {
    const stats = computeAdminStats(data, NOW);
    expect(stats.totalUsers).toBe(3);
    expect(stats.newUsersWeek).toBe(1); // only Alice
    expect(stats.newUsersMonth).toBe(2); // Alice + Bob
    expect(stats.totalCompletions).toBe(3);
  });

  test('counts active-this-week as unique users with recent progress', () => {
    const stats = computeAdminStats(data, NOW);
    expect(stats.activeUsers).toBe(1); // only u1 completed something this week
  });
});

describe('computeCourseStats', () => {
  test('derives completion counts and average progress per course', () => {
    const [html] = computeCourseStats(data);
    expect(html.totalLessons).toBe(2);
    expect(html.uniqueUsers).toBe(2);
    expect(html.completedUsers).toBe(1); // only u1 finished both lessons
    expect(html.totalCompletions).toBe(3);
    // avgProgress = round(3 / 2 / 2 * 100) = 75
    expect(html.avgProgress).toBe(75);
    expect(html.lessonCounts['HTML|Basics|Tags']).toBe(2);
    expect(html.lessonCounts['HTML|Basics|Attributes']).toBe(1);
  });
});

describe('computeTopUsers', () => {
  test('sorts by xp and joins display names', () => {
    const top = computeTopUsers(data);
    expect(top.map(u => u.name)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(top[0].total).toBe(1200);
  });

  test('respects the limit', () => {
    expect(computeTopUsers(data, 2)).toHaveLength(2);
  });

  test('falls back to "Anonymous" when no profile is found', () => {
    const top = computeTopUsers({
      users: [],
      xp: [{ user_id: 'ghost', total: 1 }],
      progress: [], quizScores: [], streaks: [], badges: [],
    });
    expect(top[0].name).toBe('Anonymous');
  });
});

describe('computeQuizStats', () => {
  test('averages scores and ignores zero-total rows', () => {
    const stats = computeQuizStats(data);
    expect(stats['html-basics'].attempts).toBe(3);
    // scores are [0.8, 0.6] — the 0/0 row is skipped
    expect(stats['html-basics'].scores).toEqual([0.8, 0.6]);
  });
});
