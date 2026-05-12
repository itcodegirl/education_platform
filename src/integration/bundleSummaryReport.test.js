import { describe, expect, it } from 'vitest';
import {
  createBundleSummary,
} from '../../scripts/write-bundle-summary.mjs';

describe('bundle summary report', () => {
  it('serializes initial budgets and top chunk evidence for CI artifacts', () => {
    const summary = createBundleSummary({
      fatalErrors: [],
      forbiddenPreloadFailures: [],
      missingRequiredFailures: [],
      initialBudgetFailures: [],
      initialJsGzipBytes: 84 * 1024,
      initialCssGzipBytes: 8 * 1024,
      sizeFailures: [],
      sizeReport: [
        {
          file: 'data-js-course.js',
          sizeBytes: 212 * 1024,
          gzipBytes: 62 * 1024,
          rawOverByKb: -48,
          gzipOverByKb: -18,
          budget: {
            label: 'course runtime data lazy chunk',
            maxKb: 260,
            gzipMaxKb: 80,
          },
        },
      ],
    }, {
      generatedAt: '2026-05-12T00:00:00.000Z',
    });

    expect(summary.initial).toMatchObject({
      jsGzipKb: 84,
      jsGzipBudgetKb: 170,
      cssGzipKb: 8,
      cssGzipBudgetKb: 12,
    });
    expect(summary.topChunks).toEqual([
      expect.objectContaining({
        file: 'data-js-course.js',
        rawKb: 212,
        gzipKb: 62,
        budget: expect.objectContaining({
          label: 'course runtime data lazy chunk',
          maxKb: 260,
          gzipMaxKb: 80,
        }),
      }),
    ]);
    expect(summary.failures).toMatchObject({
      fatal: [],
      forbiddenPreloads: [],
      missingRequired: [],
      initialBudget: [],
      size: [],
    });
  });
});
