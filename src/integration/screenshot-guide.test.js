import { describe, expect, it } from 'vitest';
import { auditScreenshotGuide } from '../../scripts/check-screenshot-guide.mjs';

describe('screenshot guide audit', () => {
  it('passes for the committed reviewer screenshot guide', () => {
    const result = auditScreenshotGuide();

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('fails when required proof-oriented captures are missing', () => {
    const result = auditScreenshotGuide({
      text: '# Screenshot Capture Guide\n\n`01-landing-auth.png`\n',
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      'docs/screenshots/README.md is missing required screenshot 03-lesson-learning-contract.png',
    );
    expect(result.issues).toContain(
      'docs/screenshots/README.md is missing progress summary trust guidance',
    );
  });
});
