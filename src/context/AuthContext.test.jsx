import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetInitialSession,
  mockLoadProfile,
  mockOnAuthStateChange,
  mockSignOut,
} = vi.hoisted(() => ({
  mockGetInitialSession: vi.fn(),
  mockLoadProfile: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  getInitialSession: mockGetInitialSession,
  loadProfile: mockLoadProfile,
  onAuthStateChange: mockOnAuthStateChange,
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGithub: vi.fn(),
  signInWithGoogle: vi.fn(),
  requestPasswordReset: vi.fn(),
  signOut: mockSignOut,
}));

import { AuthProvider, useAuth } from './AuthContext';

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function AuthProbe() {
  const { user, profile, loading, profileLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="profile-loading">{profileLoading ? 'profile-loading' : 'profile-ready'}</div>
      <div data-testid="user">{user?.id || 'no-user'}</div>
      <div data-testid="profile">{profile?.display_name || 'no-profile'}</div>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  let authCallback;

  beforeEach(() => {
    authCallback = null;
    mockGetInitialSession.mockReset();
    mockLoadProfile.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignOut.mockReset();

    mockLoadProfile.mockResolvedValue({ display_name: 'Jenna' });
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { unsubscribe: vi.fn() };
    });
  });

  it('restores an existing Supabase session before marking auth ready', async () => {
    const session = createDeferred();
    mockGetInitialSession.mockReturnValue(session.promise);

    renderAuthProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');

    await act(async () => {
      session.resolve({ id: 'user-1' });
      await session.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      expect(screen.getByTestId('user')).toHaveTextContent('user-1');
    });
    expect(mockLoadProfile).toHaveBeenCalledWith('user-1');
  });

  it('keeps auth loading while a pre-init auth event arrives before session restore completes', async () => {
    const session = createDeferred();
    mockGetInitialSession.mockReturnValue(session.promise);

    renderAuthProvider();

    await act(async () => {
      authCallback(null);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');

    await act(async () => {
      session.resolve({ id: 'user-2' });
      await session.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      expect(screen.getByTestId('user')).toHaveTextContent('user-2');
    });
  });

  it('ignores stale profile loads after a newer auth user arrives', async () => {
    const firstProfile = createDeferred();
    mockGetInitialSession.mockResolvedValue({ id: 'user-old' });
    mockLoadProfile
      .mockReturnValueOnce(firstProfile.promise)
      .mockResolvedValueOnce({ display_name: 'New User' });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user-old');
    });

    await act(async () => {
      authCallback({ id: 'user-new' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile')).toHaveTextContent('New User');
    });

    await act(async () => {
      firstProfile.resolve({ display_name: 'Old User' });
      await firstProfile.promise;
    });

    expect(screen.getByTestId('user')).toHaveTextContent('user-new');
    expect(screen.getByTestId('profile')).toHaveTextContent('New User');
  });
});
