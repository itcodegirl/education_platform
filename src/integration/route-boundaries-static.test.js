import { describe, expect, it } from 'vitest';
import { checkRouteBoundaries } from '../../scripts/check-route-boundaries.mjs';

describe('route boundary audit', () => {
  it('keeps heavy surfaces out of initial route and shell imports', () => {
    const result = checkRouteBoundaries();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
