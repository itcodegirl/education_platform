import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockQueryBuilder, mockGetOptionalConfig } = vi.hoisted(() => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  const mockAuth = {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resend: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
  const mockGetOptionalConfig = vi.fn(() => ({ configured: true }));
  return { mockAuth, mockQueryBuilder, mockGetOptionalConfig };
});

vi.mock('../lib/lazySupabaseClient', () => ({
  getLazySupabaseClient: () =>
    Promise.resolve({
      auth: mockAuth,
      from: () => mockQueryBuilder,
    }),
}));

vi.mock('../lib/supabaseConfig', () => ({
  getOptionalSupabaseBrowserConfig: () => mockGetOptionalConfig(),
}));

import {
  isAuthBackendConfigured,
  getInitialSession,
  loadProfile,
  signInWithEmail,
  signUpWithEmail,
  resendSignupConfirmation,
  signInWithGithub,
  signInWithGoogle,
  requestPasswordReset,
  signOut,
} from './authService';

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryBuilder.select.mockReturnThis();
  mockQueryBuilder.eq.mockReturnThis();
});

// ─── isAuthBackendConfigured ──────────────────────────────────
describe('isAuthBackendConfigured', () => {
  it('returns configured flag from supabaseConfig', () => {
    mockGetOptionalConfig.mockReturnValueOnce({ configured: true });
    expect(isAuthBackendConfigured()).toBe(true);
  });

  it('returns false when config is not configured', () => {
    mockGetOptionalConfig.mockReturnValueOnce({ configured: false });
    expect(isAuthBackendConfigured()).toBe(false);
  });
});

// ─── getInitialSession ────────────────────────────────────────
describe('getInitialSession', () => {
  it('returns session.user when a session exists', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
    const result = await getInitialSession();
    expect(result).toEqual(user);
  });

  it('returns null when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await getInitialSession()).toBeNull();
  });

  it('throws when Supabase returns an error', async () => {
    const err = new Error('network failure');
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: err });
    await expect(getInitialSession()).rejects.toThrow('network failure');
  });
});

// ─── loadProfile ──────────────────────────────────────────────
describe('loadProfile', () => {
  it('returns profile data for a valid user id', async () => {
    const profile = { display_name: 'Jenna', avatar_url: null, is_admin: false };
    mockQueryBuilder.maybeSingle.mockResolvedValue({ data: profile, error: null });
    const result = await loadProfile('user-1');
    expect(result).toEqual(profile);
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('throws when the profile row is missing', async () => {
    mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(loadProfile('missing')).rejects.toThrow('Profile record not found.');
  });

  it('throws when Supabase returns an error', async () => {
    const err = new Error('db error');
    mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: err });
    await expect(loadProfile('u1')).rejects.toThrow('db error');
  });
});

// ─── signInWithEmail ──────────────────────────────────────────
describe('signInWithEmail', () => {
  it('passes email and password and returns the result', async () => {
    const user = { id: 'u1' };
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    const { data, error } = await signInWithEmail('a@b.com', 'pw123');
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw123' });
    expect(data.user).toEqual(user);
    expect(error).toBeNull();
  });

  it('passes through the Supabase error without throwing', async () => {
    const err = { message: 'Invalid credentials' };
    mockAuth.signInWithPassword.mockResolvedValue({ data: null, error: err });
    const { error } = await signInWithEmail('x@y.com', 'bad');
    expect(error).toEqual(err);
  });
});

// ─── signUpWithEmail ──────────────────────────────────────────
describe('signUpWithEmail', () => {
  it('passes email, password, and displayName in options', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: { id: 'new' } }, error: null });
    await signUpWithEmail('new@user.com', 'pass', 'Jenna');
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: 'pass',
      options: { data: { display_name: 'Jenna' } },
    });
  });
});

// ─── resendSignupConfirmation ─────────────────────────────────
describe('resendSignupConfirmation', () => {
  it('calls resend with type signup and a redirectTo origin', async () => {
    mockAuth.resend.mockResolvedValue({ data: {}, error: null });
    await resendSignupConfirmation('a@b.com');
    const [call] = mockAuth.resend.mock.calls;
    expect(call[0].type).toBe('signup');
    expect(call[0].email).toBe('a@b.com');
    expect(typeof call[0].options.emailRedirectTo).toBe('string');
  });
});

// ─── signInWithGithub / signInWithGoogle ──────────────────────
describe('OAuth sign-in', () => {
  it('signInWithGithub uses the github provider', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    await signInWithGithub();
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'github' }),
    );
  });

  it('signInWithGoogle uses the google provider', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    await signInWithGoogle();
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('OAuth calls include a string redirectTo', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    await signInWithGithub();
    const [call] = mockAuth.signInWithOAuth.mock.calls;
    expect(typeof call[0].options.redirectTo).toBe('string');
  });
});

// ─── requestPasswordReset ─────────────────────────────────────
describe('requestPasswordReset', () => {
  it('calls resetPasswordForEmail with email and a string redirectTo', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset('reset@me.com');
    const [email, opts] = mockAuth.resetPasswordForEmail.mock.calls[0];
    expect(email).toBe('reset@me.com');
    expect(typeof opts.redirectTo).toBe('string');
  });
});

// ─── signOut ──────────────────────────────────────────────────
describe('signOut', () => {
  it('calls supabase.auth.signOut and returns the error field', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    const { error } = await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
    expect(error).toBeNull();
  });

  it('surfaces a sign-out error without throwing', async () => {
    const err = { message: 'sign-out failed' };
    mockAuth.signOut.mockResolvedValue({ error: err });
    const { error } = await signOut();
    expect(error).toEqual(err);
  });
});
