import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

import { supabase } from '../lib/supabaseClient';
import { getInitialSession, onAuthStateChange } from './authService';

describe('authService', () => {
  beforeEach(() => {
    supabase.auth.getSession.mockReset();
    supabase.auth.onAuthStateChange.mockReset();
  });

  it('restores the existing Supabase session user', async () => {
    const user = { id: 'user-1', email: 'learner@example.com' };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user } },
      error: null,
    });

    const restoredUser = await getInitialSession();
    expect(restoredUser).toBe(user);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('returns null when no existing session is available', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const restoredUser = await getInitialSession();
    expect(restoredUser).toBeNull();
  });

  it('throws Supabase session restore errors', async () => {
    const error = new Error('session restore failed');
    supabase.auth.getSession.mockResolvedValue({
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

  it('normalizes auth state change events to the current user', () => {
    const subscription = { unsubscribe: vi.fn() };
    let authCallback;
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription } };
    });
    const listener = vi.fn();

    expect(onAuthStateChange(listener)).toBe(subscription);
    authCallback('SIGNED_IN', { user: { id: 'user-2' } });
    authCallback('SIGNED_OUT', null);

    expect(listener).toHaveBeenNthCalledWith(1, { id: 'user-2' });
    expect(listener).toHaveBeenNthCalledWith(2, null);
  });
});
