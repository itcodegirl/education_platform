import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../../scripts/audit-curriculum-coverage.mjs';

function readRepoText(repoPath) {
  return readFileSync(path.resolve(process.cwd(), repoPath), 'utf8');
}

describe('curriculum coverage audit wiring', () => {
  it('parses report, output, and strict budget flags', () => {
    expect(parseArgs(['--summary', '--out', 'reports/tmp', '--strict', '--max-gaps', '3']))
      .toEqual({
        summary: true,
        outDir: 'reports/tmp',
        strict: true,
        maxGaps: 3,
      });
  });

  it('keeps package scripts, release docs, and ops workflow wired together', () => {
    const packageJson = JSON.parse(readRepoText('package.json'));
    const readme = readRepoText('README.md');
    const releaseChecklist = readRepoText('RELEASE_CHECKLIST.md');
    const qaChecklist = readRepoText('docs/platform-qa-release-checklist.md');
    const workflow = readRepoText('.github/workflows/ops-checks.yml');

    expect(packageJson.scripts['audit:curriculum-coverage'])
      .toBe('node scripts/audit-curriculum-coverage.mjs --summary');
    expect(packageJson.scripts['report:curriculum-coverage'])
      .toContain('--out reports/generated');
    expect(packageJson.scripts['check:quality'])
      .toContain('npm run audit:curriculum-coverage');
    expect(readme).toContain('docs/curriculum-coverage-audit.md');
    expect(releaseChecklist).toContain('npm run audit:curriculum-coverage');
    expect(qaChecklist).toContain('Curriculum Coverage section');
    expect(workflow).toContain('npm run check:production-deploy');
  });
});
