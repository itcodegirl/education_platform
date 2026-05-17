import { describe, it, expect } from 'vitest';
import { verifyWebhookAuth } from './streak-reminder.js';

const SECRET = 'test-secret-abc123';

// Build the expected HMAC signature using Node's built-in crypto
import { createHmac } from 'crypto';

function hmacFor(body) {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

describe('verifyWebhookAuth()', () => {
  it('returns false when secret is falsy', () => {
    const sig = hmacFor('body');
    expect(verifyWebhookAuth('body', '', sig, '')).toBe(false);
    expect(verifyWebhookAuth('body', null, sig, '')).toBe(false);
    expect(verifyWebhookAuth('body', undefined, sig, '')).toBe(false);
  });

  it('returns true for a correct HMAC signature', () => {
    const body = '{"userId":"abc"}';
    const sig = hmacFor(body);
    expect(verifyWebhookAuth(body, SECRET, sig, '')).toBe(true);
  });

  it('returns false for an incorrect HMAC signature', () => {
    const body = '{"userId":"abc"}';
    const badSig = hmacFor('different-body');
    expect(verifyWebhookAuth(body, SECRET, badSig, '')).toBe(false);
  });

  it('returns false when HMAC sig has wrong length (prevents timing attack via exception)', () => {
    expect(verifyWebhookAuth('body', SECRET, 'short', '')).toBe(false);
  });

  it('falls back to plain-text secret comparison when no HMAC sig is provided', () => {
    expect(verifyWebhookAuth('body', SECRET, '', SECRET)).toBe(true);
    expect(verifyWebhookAuth('body', SECRET, '', 'wrong-secret')).toBe(false);
  });

  it('prefers HMAC over plain secret when both are provided', () => {
    const body = 'payload';
    const correctSig = hmacFor(body);
    // Correct HMAC + wrong plain secret → should pass (HMAC wins)
    expect(verifyWebhookAuth(body, SECRET, correctSig, 'wrong-plain')).toBe(true);
  });
});
