import { describe, expect, it } from 'vitest';
import { ROUTE_BOUNDARY_RULES, checkRouteBoundaries } from '../../scripts/check-route-boundaries.mjs';

describe('route boundary audit', () => {
  it('keeps heavy surfaces out of initial route and shell imports', () => {
    const result = checkRouteBoundaries();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('guards Progress Summary PDF dependencies behind the export action', () => {
    expect(ROUTE_BOUNDARY_RULES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: 'src/utils/progressSummary.js',
          forbiddenSources: expect.arrayContaining(['jspdf', 'html2canvas']),
        }),
      ]),
    );
  });
});
