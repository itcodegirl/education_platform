import { describe, expect, it } from 'vitest';
import playwrightConfig from '../../playwright.config.js';
import {
  auditPlaywrightProjectReferences,
  collectProjectReferences,
  runPlaywrightProjectAudit,
} from '../../scripts/audit-playwright-projects.mjs';

describe('Playwright project reference audit', () => {
  it('flags package scripts that reference missing projects', () => {
    const packageJsonText = JSON.stringify({
      scripts: {
        broken: 'playwright test --project=missing-project',
        valid: 'playwright test --project=chromium',
      },
    });

    const references = collectProjectReferences({
      packageJsonText,
      scriptFiles: [],
    });

    const result = auditPlaywrightProjectReferences({
      config: playwrightConfig,
      references,
    });

    expect(result.invalidReferences).toEqual([
      {
        source: 'package.json scripts.broken',
        project: 'missing-project',
      },
    ]);
  });

  it('keeps package scripts and smoke runners aligned with playwright.config.js', () => {
    const result = runPlaywrightProjectAudit();
    expect(result.invalidReferences).toEqual([]);
    expect(result.references.map((reference) => reference.project)).toEqual(
      expect.arrayContaining(['authenticated-chromium', 'authenticated-mobile-chrome']),
    );
  });
});
