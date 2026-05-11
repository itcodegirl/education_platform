import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readText(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('netlify function security static checks', () => {
  it('enforces active-account checks for user-facing functions', () => {
    const shared = readText('../../netlify/functions/_shared.js');
    const ai = readText('../../netlify/functions/ai.js');
    const practice = readText('../../netlify/functions/practice-generate.js');
    const analyticsIngest = readText('../../netlify/functions/analytics-ingest.js');
    const analyticsSnapshots = readText('../../netlify/functions/analytics-snapshots.js');

    expect(shared).toMatch(/export async function verifyActiveUser/i);
    expect(shared).toMatch(/select:\s*'is_disabled'/i);
    expect(shared).toMatch(/return disabled \? null : user/i);

    [ai, practice, analyticsIngest, analyticsSnapshots].forEach((source) => {
      expect(source).toMatch(/verifyActiveUser/i);
      expect(source).not.toMatch(/\bverifyUser\b/);
    });
  });

  it('keeps AI practice generation behind email verification', () => {
    const practice = readText('../../netlify/functions/practice-generate.js');

    expect(practice).toMatch(/EMAIL_NOT_VERIFIED/i);
    expect(practice).toMatch(/email_confirmed_at[\s\S]*confirmed_at/i);
  });

  it('bounds analytics timestamps to reduce replay and future-dated data corruption', () => {
    const analyticsIngest = readText('../../netlify/functions/analytics-ingest.js');

    expect(analyticsIngest).toMatch(/MAX_EVENT_AGE_MS/i);
    expect(analyticsIngest).toMatch(/MAX_FUTURE_SKEW_MS/i);
    expect(analyticsIngest).toMatch(/parsed < now - MAX_EVENT_AGE_MS/i);
    expect(analyticsIngest).toMatch(/parsed > now \+ MAX_FUTURE_SKEW_MS/i);
  });
});
