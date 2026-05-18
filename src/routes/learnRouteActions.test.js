import { describe, it, expect } from 'vitest';
import { resolveBooleanMode } from './learnRouteActions';

describe('resolveBooleanMode', () => {
  it('returns true when mode matches the truthy value', () => {
    expect(resolveBooleanMode('complete', 'complete', 'uncomplete')).toBe(true);
  });

  it('returns false when mode matches the falsey value', () => {
    expect(resolveBooleanMode('uncomplete', 'complete', 'uncomplete')).toBe(false);
  });

  it('returns undefined for an unrecognized mode (toggle fallback)', () => {
    expect(resolveBooleanMode('toggle', 'complete', 'uncomplete')).toBeUndefined();
  });

  it('returns undefined for empty string mode', () => {
    expect(resolveBooleanMode('', 'complete', 'uncomplete')).toBeUndefined();
  });

  it('works with bookmark save/remove values', () => {
    expect(resolveBooleanMode('save', 'save', 'remove')).toBe(true);
    expect(resolveBooleanMode('remove', 'save', 'remove')).toBe(false);
    expect(resolveBooleanMode('toggle', 'save', 'remove')).toBeUndefined();
  });
});
