import { describe, it, expect } from 'vitest';
import { toInt, toTopUsers, toFunnel, toReliability, normalizeDashboardMetrics } from './useAdminData';

describe('toInt', () => {
  it('converts integer string to number', () => {
    expect(toInt('42')).toBe(42);
  });

  it('converts float string by rounding', () => {
    expect(toInt('3.7')).toBe(4);
  });

  it('returns 0 for non-numeric input', () => {
    expect(toInt('abc')).toBe(0);
    expect(toInt(null)).toBe(0);
    expect(toInt(undefined)).toBe(0);
  });

  it('clamps negative values to 0', () => {
    expect(toInt(-5)).toBe(0);
  });

  it('passes through a positive integer', () => {
    expect(toInt(100)).toBe(100);
  });
});

describe('toTopUsers', () => {
  it('returns empty array for non-array input', () => {
    expect(toTopUsers(null)).toEqual([]);
    expect(toTopUsers('not-array')).toEqual([]);
  });

  it('maps rows to normalized shape', () => {
    const result = toTopUsers([{ user_id: 'u1', name: 'Alice', total: 5 }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ user_id: 'u1', name: 'Alice', total: 5 });
  });

  it('uses "Anonymous" when name is missing', () => {
    const result = toTopUsers([{ user_id: 'u1' }]);
    expect(result[0].name).toBe('Anonymous');
  });

  it('filters out rows without user_id', () => {
    const result = toTopUsers([{ name: 'Alice', total: 5 }]);
    expect(result).toHaveLength(0);
  });

  it('limits to 10 users', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ user_id: `u${i}`, name: `U${i}`, total: i }));
    expect(toTopUsers(rows)).toHaveLength(10);
  });
});

describe('toFunnel', () => {
  it('returns empty object for null/undefined', () => {
    expect(toFunnel(null)).toEqual({});
    expect(toFunnel(undefined)).toEqual({});
  });

  it('normalizes all funnel fields to integers', () => {
    const result = toFunnel({ lessonViewed: '10', lessonCompleted: 5 });
    expect(result.lessonViewed).toBe(10);
    expect(result.lessonCompleted).toBe(5);
  });

  it('defaults missing fields to 0', () => {
    const result = toFunnel({});
    expect(result.onboardingOpened).toBe(0);
    expect(result.lessonCompleted).toBe(0);
  });
});

describe('toReliability', () => {
  it('returns empty object for null', () => {
    expect(toReliability(null)).toEqual({});
  });

  it('normalizes reliability fields', () => {
    const result = toReliability({ serviceWorkerEvents: '3', offlineFallbacks: 2 });
    expect(result.serviceWorkerEvents).toBe(3);
    expect(result.offlineFallbacks).toBe(2);
  });
});

describe('normalizeDashboardMetrics', () => {
  it('returns initial metrics for null input', () => {
    const result = normalizeDashboardMetrics(null);
    expect(result.totalUsers).toBe(0);
    expect(result.topUsers).toEqual([]);
  });

  it('normalizes all top-level integer fields', () => {
    const result = normalizeDashboardMetrics({
      totalUsers: '50',
      newUsersWeek: 10,
      totalXP: '1200',
    });
    expect(result.totalUsers).toBe(50);
    expect(result.newUsersWeek).toBe(10);
    expect(result.totalXP).toBe(1200);
  });

  it('normalizes funnel7d and funnel30d sub-objects', () => {
    const result = normalizeDashboardMetrics({
      funnel7d: { lessonViewed: 5 },
      funnel30d: { lessonCompleted: 3 },
    });
    expect(result.funnel7d.lessonViewed).toBe(5);
    expect(result.funnel30d.lessonCompleted).toBe(3);
  });

  it('normalizes topUsers list', () => {
    const result = normalizeDashboardMetrics({
      topUsers: [{ user_id: 'u1', name: 'Alice', total: 10 }],
    });
    expect(result.topUsers).toHaveLength(1);
    expect(result.topUsers[0].name).toBe('Alice');
  });
});
