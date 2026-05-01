// ═══════════════════════════════════════════════
// Unit tests for ProgressContext — load path
//
// We render ProgressProvider with a test consumer
// and verify that the context state transitions
// correctly based on what progressService returns.
//
// Mocks:
//   • AuthContext.useAuth — controlled user value
//   • progressService — controlled fetch responses
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  getProgressWriteQueueStorageKey,
  readProgressWriteQueue,
} from '../services/progressWriteQueue';
import { getTodayString, getYesterdayString } from '../utils/helpers';

// ─── Hoist mutable mocks so vi.mock factories can reference them ──
const {
  mockUseAuth,
  mockFetchAllUserData,
  mockUpdateStreak,
  mockUpdateDailyGoal,
  mockUpdateXP,
  mockTrackProgressSyncQueued,
  mockTrackProgressSyncReplay,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFetchAllUserData: vi.fn(),
  mockUpdateStreak: vi.fn(),
  mockUpdateDailyGoal: vi.fn(),
  mockUpdateXP: vi.fn(),
  mockTrackProgressSyncQueued: vi.fn(),
  mockTrackProgressSyncReplay: vi.fn(),
}));

// ─── Mock AuthContext ────────────────────────────
vi.mock('./AuthContext', () => ({
  useAuth: mockUseAuth,
}));

// ─── Mock progressService ────────────────────────
vi.mock('../services/progressService', () => ({
  fetchAllUserData: (...args) => mockFetchAllUserData(...args),
  // Write functions — not triggered by load, but imported by the module
  addLesson: vi.fn(),
  removeLesson: vi.fn(),
  saveQuizScore: vi.fn(),
  updateXP: (...args) => mockUpdateXP(...args),
  updateStreak: (...args) => mockUpdateStreak(...args),
  updateDailyGoal: (...args) => mockUpdateDailyGoal(...args),
  awardBadge: vi.fn(),
  addSRCard: vi.fn(),
  updateSRCard: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  saveNote: vi.fn(),
  savePosition: vi.fn(),
  trackCourseVisit: vi.fn(),
}));

vi.mock('../services/progressSyncTelemetry', () => ({
  trackProgressSyncQueued: mockTrackProgressSyncQueued,
  trackProgressSyncReplay: mockTrackProgressSyncReplay,
}));

import { ProgressProvider, useProgressData, useXP } from './ProgressContext';

// ─── Test consumer ───────────────────────────────
// Renders a div with data attributes we can query in tests.
function TestConsumer() {
  const { dataLoaded, loadError, completed, syncFailed } = useProgressData();
  return (
    <div
      data-testid="consumer"
      data-loaded={String(dataLoaded)}
      data-error={loadError ?? ''}
      data-completed={completed.join(',')}
      data-sync-failed={String(syncFailed)}
    />
  );
}

function XPTestConsumer() {
  const { streak, dailyCount, recordDailyActivity } = useXP();
  return (
    <button
      type="button"
      data-testid="activity"
      data-streak={String(streak)}
      data-daily={String(dailyCount)}
      onClick={recordDailyActivity}
    >
      Record activity
    </button>
  );
}

function XPWriteConsumer() {
  const { awardXP } = useXP();
  const {
    syncFailed,
    pendingSyncWrites,
    syncRetryInFlight,
    retryPendingSyncWrites,
  } = useProgressData();

  return (
    <>
      <button
        type="button"
        data-testid="award-xp"
        data-sync-failed={String(syncFailed)}
        data-pending-sync={String(pendingSyncWrites)}
        data-retrying={String(syncRetryInFlight)}
        onClick={() => awardXP(25, 'Test XP')}
      >
        Award XP
      </button>
      <button
        type="button"
        data-testid="retry-pending"
        onClick={() => retryPendingSyncWrites()}
      >
        Retry pending
      </button>
    </>
  );
}

// Consumer for the XP-popup queue tests below. Exposes the head of the
// queue plus actions to enqueue / dismiss so tests can drive the
// queue without relying on the full reward pipeline.
function XPPopupQueueConsumer() {
  const { xpPopup, awardXP, clearXPPopup } = useXP();
  return (
    <div data-testid="xp-popup-consumer">
      <div data-testid="xp-popup-amount">{xpPopup ? String(xpPopup.amount) : ''}</div>
      <div data-testid="xp-popup-reason">{xpPopup ? xpPopup.reason : ''}</div>
      <button type="button" data-testid="award-30" onClick={() => awardXP(30, 'Quiz completed')}>
        +30
      </button>
      <button type="button" data-testid="award-50" onClick={() => awardXP(50, 'Perfect quiz score!')}>
        +50
      </button>
      <button type="button" data-testid="dismiss" onClick={clearXPPopup}>
        Dismiss
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ProgressProvider>
      <TestConsumer />
    </ProgressProvider>,
  );
}

function renderXPWithProvider() {
  return render(
    <ProgressProvider>
      <XPTestConsumer />
    </ProgressProvider>,
  );
}

function renderXPWriteWithProvider() {
  return render(
    <ProgressProvider>
      <XPWriteConsumer />
    </ProgressProvider>,
  );
}

function renderXPPopupQueueWithProvider() {
  return render(
    <ProgressProvider>
      <XPPopupQueueConsumer />
    </ProgressProvider>,
  );
}

// Helper: build a minimal successful fetchAllUserData response
function makeFetchResult(overrides = {}) {
  return {
    progress:  { data: [], error: null },
    quiz:      { data: [], error: null },
    xp:        { data: null, error: null },
    streak:    { data: null, error: null },
    daily:     { data: null, error: null },
    badges:    { data: [], error: null },
    sr:        { data: [], error: null },
    bookmarks: { data: [], error: null },
    notes:     { data: [], error: null },
    visited:   { data: [], error: null },
    position:  { data: null, error: null },
    ...overrides,
  };
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  const storage = createMemoryStorage();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
  ['uid-write', 'uid-retry'].forEach((userId) => {
    window.localStorage.removeItem(getProgressWriteQueueStorageKey(userId));
  });
  mockUpdateXP.mockResolvedValue({ error: null });
  mockUpdateStreak.mockResolvedValue({});
  mockUpdateDailyGoal.mockResolvedValue({});
  mockTrackProgressSyncQueued.mockReset();
  mockTrackProgressSyncReplay.mockReset();
});

// ─── Tests ───────────────────────────────────────

describe('ProgressContext — no user logged in', () => {
  it('stays in the unloaded state when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderWithProvider();

    const el = screen.getByTestId('consumer');
    expect(el.dataset.loaded).toBe('false');
    expect(mockFetchAllUserData).not.toHaveBeenCalled();
  });

  it('surfaces localStorage persistence failures through syncFailed', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderWithProvider();

    window.dispatchEvent(new window.CustomEvent('chw:local-storage-sync-error', {
      detail: { key: 'chw-tasks', phase: 'write' },
    }));

    await waitFor(() => {
      expect(screen.getByTestId('consumer').dataset.syncFailed).toBe('1');
    });
  });
});

describe('ProgressContext — user logged in (happy path)', () => {
  it('calls fetchAllUserData with the user id', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-abc' } });
    mockFetchAllUserData.mockResolvedValue(makeFetchResult());

    renderWithProvider();

    await waitFor(() =>
      expect(mockFetchAllUserData).toHaveBeenCalledWith('uid-abc'),
    );
  });

  it('sets dataLoaded=true after a successful fetch', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-abc' } });
    mockFetchAllUserData.mockResolvedValue(makeFetchResult());

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('consumer').dataset.loaded).toBe('true');
    });
  });

  it('populates completed from progress rows', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-abc' } });
    mockFetchAllUserData.mockResolvedValue(
      makeFetchResult({
        progress: {
          data: [{ lesson_key: 'HTML|Basics|Intro' }, { lesson_key: 'HTML|Basics|Tags' }],
          error: null,
        },
      }),
    );

    renderWithProvider();

    await waitFor(() => {
      const el = screen.getByTestId('consumer');
      expect(el.dataset.completed).toBe('HTML|Basics|Intro,HTML|Basics|Tags');
    });
  });

  it('does not update streak just because progress data loaded', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-abc' } });
    mockFetchAllUserData.mockResolvedValue(
      makeFetchResult({
        streak: {
          data: { days: 3, last_date: '2026-01-01' },
          error: null,
        },
      }),
    );

    renderXPWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('activity').dataset.streak).toBe('3');
    });

    expect(mockUpdateStreak).not.toHaveBeenCalled();
  });

  it('updates streak when explicit learning activity is recorded', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-abc' } });
    mockFetchAllUserData.mockResolvedValue(
      makeFetchResult({
        streak: {
          data: { days: 3, last_date: getYesterdayString() },
          error: null,
        },
      }),
    );

    renderXPWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('activity').dataset.streak).toBe('3');
    });

    fireEvent.click(screen.getByTestId('activity'));

    await waitFor(() => {
      expect(mockUpdateStreak).toHaveBeenCalledWith('uid-abc', 4, getTodayString());
    });
    expect(screen.getByTestId('activity').dataset.streak).toBe('4');
  });
});

describe('ProgressContext — fetch error', () => {
  it('sets loadError when fetchAllUserData rejects', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-xyz' } });
    mockFetchAllUserData.mockRejectedValue(new Error('DB unavailable'));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('consumer').dataset.error).toBe('DB unavailable');
    });
  });

  it('still marks dataLoaded=true so the UI is not stuck on a spinner', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-xyz' } });
    mockFetchAllUserData.mockRejectedValue(new Error('timeout'));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('consumer').dataset.loaded).toBe('true');
    });
  });
});

describe('ProgressContext write failure detection', () => {
  it('queues Supabase result errors returned by optimistic writes', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-write' } });
    mockFetchAllUserData.mockResolvedValue(makeFetchResult());
    mockUpdateXP.mockResolvedValue({
      data: null,
      error: { message: 'write timeout' },
    });

    renderXPWriteWithProvider();

    await waitFor(() => {
      expect(mockFetchAllUserData).toHaveBeenCalledWith('uid-write');
    });

    fireEvent.click(screen.getByTestId('award-xp'));

    await waitFor(() => {
      expect(screen.getByTestId('award-xp').dataset.pendingSync).toBe('1');
    });
    expect(screen.getByTestId('award-xp').dataset.syncFailed).toBe('0');
    expect(readProgressWriteQueue('uid-write')).toHaveLength(1);
    expect(mockUpdateXP).toHaveBeenCalledWith('uid-write', 25);
    expect(mockTrackProgressSyncQueued).toHaveBeenCalledWith({
      operation: 'updateXP',
      label: 'updateXP',
      queueSize: 1,
    });
  });

  it('retries queued progress writes and clears the pending queue', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-retry' } });
    mockFetchAllUserData.mockResolvedValue(makeFetchResult());
    mockUpdateXP.mockResolvedValueOnce({
      data: null,
      error: { message: 'write timeout' },
    });

    renderXPWriteWithProvider();

    await waitFor(() => {
      expect(mockFetchAllUserData).toHaveBeenCalledWith('uid-retry');
    });

    fireEvent.click(screen.getByTestId('award-xp'));

    await waitFor(() => {
      expect(screen.getByTestId('award-xp').dataset.pendingSync).toBe('1');
    });

    fireEvent.click(screen.getByTestId('retry-pending'));

    await waitFor(() => {
      expect(screen.getByTestId('award-xp').dataset.pendingSync).toBe('0');
    });
    expect(readProgressWriteQueue('uid-retry')).toEqual([]);
    expect(mockUpdateXP).toHaveBeenCalledTimes(2);
    expect(mockTrackProgressSyncReplay).toHaveBeenCalledWith({
      trigger: 'manual',
      processed: 1,
      remaining: 0,
      failedItem: null,
      error: null,
    });
  });
});

describe('ProgressContext — XP popup queue', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'uid-popup' } });
    mockFetchAllUserData.mockResolvedValue(makeFetchResult());
  });

  it('shows the first popup, then the second one only after dismissal', async () => {
    renderXPPopupQueueWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('award-30')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('award-30'));
    fireEvent.click(screen.getByTestId('award-50'));

    await waitFor(() => {
      expect(screen.getByTestId('xp-popup-amount').textContent).toBe('30');
      expect(screen.getByTestId('xp-popup-reason').textContent).toBe('Quiz completed');
    });

    fireEvent.click(screen.getByTestId('dismiss'));

    await waitFor(() => {
      expect(screen.getByTestId('xp-popup-amount').textContent).toBe('50');
      expect(screen.getByTestId('xp-popup-reason').textContent).toBe('Perfect quiz score!');
    });

    fireEvent.click(screen.getByTestId('dismiss'));

    await waitFor(() => {
      expect(screen.getByTestId('xp-popup-amount').textContent).toBe('');
    });
  });

  it('clearXPPopup is a safe no-op when the queue is already empty', async () => {
    renderXPPopupQueueWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('award-30')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('dismiss'));
    fireEvent.click(screen.getByTestId('dismiss'));

    expect(screen.getByTestId('xp-popup-amount').textContent).toBe('');
  });
});
