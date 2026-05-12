import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

async function readProjectFile(filePath) {
  return readFile(path.join(projectRoot, filePath), 'utf8');
}

describe('performance evidence documentation', () => {
  it('keeps reviewer guidance connected to CI artifacts and budgets', async () => {
    const [evidenceDoc, reviewerMap, prTemplate] = await Promise.all([
      readProjectFile('docs/performance-evidence.md'),
      readProjectFile('docs/reviewer-evidence-map.md'),
      readProjectFile('.github/PULL_REQUEST_TEMPLATE.md'),
    ]);

    expect(evidenceDoc).toContain('lighthouse-ci-*');
    expect(evidenceDoc).toContain('bundle-summary-*');
    expect(evidenceDoc).toContain('dist/bundle-summary.json');
    expect(evidenceDoc).toContain('dist/bundle-review-summary.md');
    expect(evidenceDoc).toContain('codeherway-bundle-review-summary');
    expect(evidenceDoc).toContain('docs/authenticated-performance-evidence.md');
    expect(evidenceDoc).toContain('docs/performance-budget.md');
    expect(evidenceDoc).toContain('React Profiler');
    expect(reviewerMap).toContain('docs/performance-evidence.md');
    expect(reviewerMap).toContain('docs/authenticated-performance-evidence.md');
    expect(prTemplate).toContain('docs/performance-evidence.md');
  });
});
