import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

async function readProjectFile(filePath) {
  return readFile(path.join(projectRoot, filePath), 'utf8');
}

describe('performance workflow wiring', () => {
  it('keeps the performance audit script available for reviewers and CI', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json'));
    const lighthouseWorkflow = await readProjectFile('.github/workflows/lighthouse-ci.yml');

    expect(packageJson.scripts['audit:performance']).toBe(
      'npm run build && npm run check:bundle && npm run check:route-boundaries && npm run report:bundle && npm run report:bundle-review',
    );
    expect(packageJson.scripts['report:bundle']).toBe('node scripts/write-bundle-summary.mjs');
    expect(packageJson.scripts['report:bundle-review']).toBe('node scripts/write-bundle-review-summary.mjs');
    expect(packageJson.scripts['test:lighthouse']).toBe(
      'npm run test:lighthouse:desktop && npm run test:lighthouse:mobile',
    );
    expect(packageJson.scripts['test:lighthouse:desktop']).toContain('./lighthouserc.json');
    expect(packageJson.scripts['test:lighthouse:mobile']).toContain('./lighthouserc.mobile.json');
    expect(lighthouseWorkflow).toContain('npm run audit:performance');
    expect(lighthouseWorkflow).toContain('Publish bundle summary to job summary');
    expect(lighthouseWorkflow).toContain('Comment bundle summary on pull requests');
    expect(lighthouseWorkflow).toContain('codeherway-bundle-review-summary');
    expect(lighthouseWorkflow).toContain('npm run test:lighthouse');
    expect(lighthouseWorkflow).toContain('Upload Lighthouse reports');
    expect(lighthouseWorkflow).toContain('.lighthouseci/');
    expect(lighthouseWorkflow).toContain('Upload bundle summary artifact');
    expect(lighthouseWorkflow).toContain('dist/bundle-summary.json');
    expect(lighthouseWorkflow).toContain('dist/bundle-review-summary.md');
  });
});
