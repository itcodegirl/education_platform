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


// ─── buildStreakReminderHtml ──────────────────────────────────────────────────

import { buildStreakReminderHtml } from './streak-reminder.js';

describe('buildStreakReminderHtml()', () => {
  it('includes the learner name in the output', () => {
    const html = buildStreakReminderHtml({ name: 'Jenna', streakDays: 7 });
    expect(html).toContain('Jenna');
  });

  it('includes the streak day count', () => {
    const html = buildStreakReminderHtml({ name: 'Jenna', streakDays: 12 });
    expect(html).toContain('12');
  });

  it('starts with a valid HTML doctype declaration', () => {
    const html = buildStreakReminderHtml({ name: 'Anyone', streakDays: 3 });
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('contains a call-to-action link to codeherway.com', () => {
    const html = buildStreakReminderHtml({ name: 'Anyone', streakDays: 3 });
    expect(html).toContain('codeherway.com');
  });

  it('reflects different streak lengths correctly', () => {
    const html3 = buildStreakReminderHtml({ name: 'Ali', streakDays: 3 });
    const html30 = buildStreakReminderHtml({ name: 'Ali', streakDays: 30 });
    expect(html3).toContain('3-day streak');
    expect(html30).toContain('30-day streak');
  });
});
