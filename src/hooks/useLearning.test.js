import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockCreateLearningEngine, mockIsBackendRewardSyncEnabled } = vi.hoisted(() => ({
  mockCreateLearningEngine: vi.fn((args) => ({ _args: args, completeLesson: vi.fn() })),
  mockIsBackendRewardSyncEnabled: vi.fn(() => false),
}));

vi.mock('../services/learningEngine', () => ({
  createLearningEngine: (...args) => mockCreateLearningEngine(...args),
}));

vi.mock('../services/rewardEventService', () => ({
  isBackendRewardSyncEnabled: () => mockIsBackendRewardSyncEnabled(),
}));

const mockProgressData = {
  toggleLesson: vi.fn(),
  saveQuizScore: vi.fn(),
  quizScores: {},
  completedSet: new Set(),
  hasRewardBeenAwarded: vi.fn(),
  markRewardAwarded: vi.fn(),
  isChallengeCompleted: vi.fn(),
  markChallengeCompleted: vi.fn(),
  markSyncFailed: vi.fn(),
};

let mockUserId = 'user-1';

vi.mock('../providers', () => ({
  useAuth: () => ({ user: mockUserId ? { id: mockUserId } : null }),
  useProgressData: () => mockProgressData,
  useXP: () => ({ awardXP: vi.fn(), recordDailyActivity: vi.fn() }),
}));

import { useLearning } from './useLearning';

describe('useLearning', () => {
  it('returns the engine created by createLearningEngine', () => {
    const { result } = renderHook(() => useLearning());
    expect(result.current).toBeDefined();
    expect(mockCreateLearningEngine).toHaveBeenCalledTimes(1);
  });

  it('passes the user id as learnerKey', () => {
    mockUserId = 'learner-42';
    renderHook(() => useLearning());
    const [args] = mockCreateLearningEngine.mock.calls;
    expect(args[0].learnerKey).toBe('learner-42');
  });

  it('passes empty string as learnerKey when user is null', () => {
    mockUserId = null;
    renderHook(() => useLearning());
    const lastArgs = mockCreateLearningEngine.mock.calls.at(-1);
    expect(lastArgs[0].learnerKey).toBe('');
  });

  it('passes all required progressData methods to the engine', () => {
    mockUserId = 'user-1';
    renderHook(() => useLearning());
    const [args] = mockCreateLearningEngine.mock.calls;
    expect(typeof args[0].toggleLesson).toBe('function');
    expect(typeof args[0].saveQuizScore).toBe('function');
    expect(typeof args[0].hasRewardBeenAwarded).toBe('function');
    expect(typeof args[0].markRewardAwarded).toBe('function');
    expect(typeof args[0].markSyncFailed).toBe('function');
  });

  it('engine reference is stable across re-renders with the same deps', () => {
    mockUserId = 'user-1';
    const { result, rerender } = renderHook(() => useLearning());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('creates a new engine when the user id changes', () => {
    mockUserId = 'user-a';
    const { result, rerender } = renderHook(() => useLearning());
    const first = result.current;

    mockUserId = 'user-b';
    rerender();
    expect(result.current).not.toBe(first);
    expect(mockCreateLearningEngine.mock.calls.length).toBeGreaterThan(1);
  });
});
