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
      'npm run build && npm run check:bundle && npm run check:route-boundaries',
    );
    expect(lighthouseWorkflow).toContain('npm run audit:performance');
    expect(lighthouseWorkflow).toContain('npm run test:lighthouse');
  });
});
