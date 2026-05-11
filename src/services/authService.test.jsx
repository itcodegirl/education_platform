import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetLazySupabaseClient,
  mockSupabase,
} = vi.hoisted(() => ({
  mockGetLazySupabaseClient: vi.fn(),
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
  supabaseConfigStatus: { configured: true },
}));

vi.mock('../lib/lazySupabaseClient', () => ({
  getLazySupabaseClient: mockGetLazySupabaseClient,
}));

import { getInitialSession, onAuthStateChange } from './authService';

describe('authService', () => {
  beforeEach(() => {
    mockGetLazySupabaseClient.mockReset();
    mockGetLazySupabaseClient.mockReturnValue(mockSupabase);
    mockSupabase.auth.getSession.mockReset();
    mockSupabase.auth.onAuthStateChange.mockReset();
  });

  it('restores the existing Supabase session user', async () => {
    const user = { id: 'user-1', email: 'learner@example.com' };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user } },
      error: null,
    });

    const restoredUser = await getInitialSession();
    expect(restoredUser).toBe(user);
    expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('returns null when no existing session is available', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const restoredUser = await getInitialSession();
    expect(restoredUser).toBeNull();
  });

  it('throws Supabase session restore errors', async () => {
    const error = new Error('session restore failed');
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error,
    });

    await getInitialSession()
      .then(() => {
        throw new Error('Expected getInitialSession to reject');
      })
      .catch((caughtError) => {
        expect(caughtError).toBe(error);
      });
  });

  it('returns a subscription proxy immediately', () => {
    const listener = vi.fn();
    const subscription = onAuthStateChange(listener);

    expect(subscription).toEqual({ unsubscribe: expect.any(Function) });
    expect(mockSupabase.auth.onAuthStateChange).not.toHaveBeenCalled();
  });

  it('normalizes auth state change events to the current user', async () => {
    const realSubscription = { unsubscribe: vi.fn() };
    let authCallback;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: realSubscription } };
    });
    const listener = vi.fn();

    const subscription = onAuthStateChange(listener);
    await vi.waitFor(() => {
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });

    authCallback('SIGNED_IN', { user: { id: 'user-2' } });
    authCallback('SIGNED_OUT', null);

    expect(listener).toHaveBeenNthCalledWith(1, { id: 'user-2' });
    expect(listener).toHaveBeenNthCalledWith(2, null);

    subscription.unsubscribe();
    expect(realSubscription.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
