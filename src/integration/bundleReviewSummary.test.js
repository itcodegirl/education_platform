import { describe, expect, it } from 'vitest';
import { createBundleReviewSummary } from '../../scripts/write-bundle-review-summary.mjs';

describe('bundle review summary', () => {
  it('formats initial budget headroom and top chunks for PR reviewers', () => {
    const markdown = createBundleReviewSummary({
      generatedAt: '2026-05-12T00:00:00.000Z',
      initial: {
        jsGzipKb: 84.12,
        jsGzipBudgetKb: 170,
        cssGzipKb: 8.21,
        cssGzipBudgetKb: 12,
      },
      topChunks: [
        {
          file: 'data-js-course.js',
          gzipKb: 61.66,
          budget: {
            label: 'course runtime data lazy chunk',
            maxKb: 260,
            gzipMaxKb: 80,
          },
        },
      ],
      failures: {
        fatal: [],
        forbiddenPreloads: [],
        missingRequired: [],
        initialBudget: [],
        size: [],
      },
    });

    expect(markdown).toContain('## Bundle Review Summary');
    expect(markdown).toContain('Status: Passing');
    expect(markdown).toContain('| Initial JS gzip | 84.12 kB | 170.00 kB | 85.88 kB remaining |');
    expect(markdown).toContain('`data-js-course.js`');
    expect(markdown).toContain('Do not raise budgets to pass CI');
  });
});
