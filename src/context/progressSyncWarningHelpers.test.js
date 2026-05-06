import { describe, expect, it } from 'vitest';
import { collectRecoverableLoadWarnings } from './progressSyncWarningHelpers';

describe('progressSyncWarningHelpers', () => {
  it('collects trimmed recoverable warning messages in declaration order', () => {
    expect(
      collectRecoverableLoadWarnings({
        notes: { message: ' Notes failed to load. ' },
        badges: { message: 'Badges failed to load.' },
      }),
    ).toEqual(['Notes failed to load.', 'Badges failed to load.']);
  });

  it('ignores blank or missing warning messages', () => {
    expect(
      collectRecoverableLoadWarnings({
        notes: { message: '   ' },
        badges: {},
        sr: null,
      }),
    ).toEqual([]);
  });
});
