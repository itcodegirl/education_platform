import { describe, it, expect } from 'vitest';
import { getFriendlyAuthError } from './authErrorMessages';

describe('getFriendlyAuthError', () => {
  it('translates invalid credentials to a learner-facing message', () => {
    expect(getFriendlyAuthError('Invalid login credentials', 'fallback')).toBe(
      'Email or password is incorrect. Double-check both and try again.',
    );
  });

  it('translates email-not-confirmed to a clear next step', () => {
    expect(getFriendlyAuthError('Email not confirmed', 'fallback')).toBe(
      'Confirm your email first, then sign in.',
    );
  });

  it('translates duplicate registration into a "try logging in" hint', () => {
    expect(getFriendlyAuthError('User already registered', 'fallback')).toBe(
      'An account already exists for this email. Try logging in instead.',
    );
    expect(getFriendlyAuthError('Email has already been registered', 'fallback')).toBe(
      'An account already exists for this email. Try logging in instead.',
    );
  });

  it('translates rate-limit into a wait hint', () => {
    expect(getFriendlyAuthError('Too many requests', 'fallback')).toBe(
      'Too many attempts right now. Wait a minute, then try again.',
    );
  });

  it('translates network failure into a connection hint', () => {
    expect(getFriendlyAuthError('Failed to fetch', 'fallback')).toBe(
      'Connection failed. Check your internet and try again.',
    );
  });

  it('falls back to the provided fallback when message is empty', () => {
    expect(getFriendlyAuthError('', 'something went wrong')).toBe('something went wrong');
    expect(getFriendlyAuthError(undefined, 'fallback')).toBe('fallback');
  });

  it('falls back to the original message when no rule matches', () => {
    expect(getFriendlyAuthError('Disco issue', 'fallback')).toBe('Disco issue');
  });
});
