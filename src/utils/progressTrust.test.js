import { describe, expect, it } from 'vitest';
import {
  PROGRESS_TRUST_SCOPES,
  getProgressSummaryTrustNotice,
  getProgressSyncNotice,
  getProgressTrustCopy,
} from './progressTrust';

describe('progress trust copy', () => {
  it('separates local, account-synced, and verified trust scopes', () => {
    expect(getProgressTrustCopy(PROGRESS_TRUST_SCOPES.LOCAL)).toMatchObject({
      label: 'Saved on this device',
      detail: expect.stringContaining('single-device today'),
    });
    expect(getProgressTrustCopy(PROGRESS_TRUST_SCOPES.ACCOUNT)).toMatchObject({
      label: 'Account sync when connected',
      detail: expect.stringContaining('may sync to your account'),
    });
    expect(getProgressTrustCopy(PROGRESS_TRUST_SCOPES.VERIFIED)).toMatchObject({
      label: 'Verified completion evidence',
      detail: expect.stringContaining('server-backed completion'),
    });
  });

  it('keeps progress sync copy honest about account and local boundaries', () => {
    expect(getProgressSyncNotice()).toContain('Progress sync: saved on this device');
    expect(getProgressSyncNotice()).toContain('Lesson completions, bookmarks, and notes may sync');
    expect(getProgressSyncNotice()).toContain('single-device today');
  });

  it('does not let progress summaries read as verified credentials', () => {
    expect(getProgressSummaryTrustNotice()).toContain('not server-authoritative yet');
    expect(getProgressSummaryTrustNotice()).toContain('Requires server-backed completion');
  });
});
