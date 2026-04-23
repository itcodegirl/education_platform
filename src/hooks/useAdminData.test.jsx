import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

import { useAdminData } from './useAdminData';

function makeChain({ data = null, error = null, count = null } = {}) {
  const result = Promise.resolve({ data, error, count });
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => result),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  };
  return chain;
}

describe('useAdminData', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it('fails closed when is_admin is false (no admin data fan-out)', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') {
        return makeChain({ data: { is_admin: false } });
      }
      throw new Error(`Unexpected table fetch: ${table}`);
    });
    mockRpc.mockImplementation(() => Promise.resolve({ data: null, error: null }));

    const { result } = renderHook(() => useAdminData({ id: 'user-1' }));

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(mockFrom.mock.calls.every(([table]) => table === 'profiles')).toBe(true);
  });

  it('loads admin datasets only after admin check succeeds', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') {
        const result = Promise.resolve({ data: [{ id: 'user-1' }], error: null, count: 1 });
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          maybeSingle: vi.fn(() => Promise.resolve({ data: { is_admin: true }, error: null })),
          order: vi.fn(() => chain),
          range: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          then: result.then.bind(result),
          catch: result.catch.bind(result),
        };
        return chain;
      }
      if (table === 'admin_user_rollups') {
        return makeChain({
          data: [{
            id: 'user-1',
            display_name: 'Ava',
            is_admin: true,
            is_disabled: false,
            lessons_done: 3,
            xp_total: 100,
            streak_days: 3,
            badges_earned: 1,
            created_at: new Date().toISOString(),
          }],
          count: 1,
        });
      }
      if (table === 'progress') return makeChain({ data: [{ lesson_key: 'c:html|m:1|l:1' }] });
      if (table === 'quiz_scores') return makeChain({ data: [{ quiz_key: 'l:1', score: '1/1' }] });
      throw new Error(`Unexpected table fetch: ${table}`);
    });
    mockRpc.mockImplementation((fnName) => {
      if (fnName === 'admin_dashboard_metrics') {
        return Promise.resolve({
          data: {
            totalUsers: 1,
            newUsersWeek: 1,
            newUsersMonth: 1,
            activeUsersWeek: 1,
            totalCompletions: 1,
            totalQuizAttempts: 1,
            totalBadges: 1,
            totalXP: 100,
            topUsers: [{ user_id: 'user-1', total: 100, name: 'Ava' }],
            funnel7d: { lessonViewed: 1, lessonCompleted: 1 },
            funnel30d: { lessonViewed: 2, lessonCompleted: 1 },
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useAdminData({ id: 'user-1' }));

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAdmin).toBe(true);
    });

    expect(result.current.data.users).toHaveLength(1);
    expect(result.current.data.progress).toHaveLength(1);
    expect(result.current.data.quizScores).toHaveLength(1);
    expect(result.current.usersCounts.total).toBe(1);
    expect(result.current.usersCounts.newWeek).toBe(1);
    expect(result.current.usersCounts.newMonth).toBe(1);
    expect(result.current.dashboardMetrics.totalXP).toBe(100);
  });
});
