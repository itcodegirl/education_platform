/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_GUIDE_PATH = 'docs/screenshots/README.md';

const REQUIRED_SCREENSHOTS = Object.freeze([
  '01-landing-auth.png',
  '02-first-lesson-preview.png',
  '03-lesson-learning-contract.png',
  '04-progress-evidence.png',
  '05-mobile-learning.png',
  '06-progress-summary-trust.png',
]);

const REQUIRED_PATTERNS = Object.freeze([
  {
    label: 'dedicated demo account privacy guidance',
    pattern: /dedicated demo account/i,
  },
  {
    label: 'real learner data warning',
    pattern: /Do not capture real learner/i,
  },
  {
    label: 'mobile viewport guidance',
    pattern: /390x844|430x932/i,
  },
  {
    label: 'learning contract capture guidance',
    pattern: /prerequisite, outcome, guided practice, recall check, and proof\/transfer/i,
  },
  {
    label: 'progress summary trust guidance',
    pattern: /not a verified credential/i,
  },
  {
    label: 'Lighthouse artifact boundary',
    pattern: /\.lighthouseci\//,
  },
]);

function readGuide(rootDir, guidePath) {
  return readFileSync(path.join(rootDir, guidePath), 'utf8');
}

export function auditScreenshotGuide({
  rootDir = process.cwd(),
  guidePath = DEFAULT_GUIDE_PATH,
  text = existsSync(path.join(rootDir, guidePath)) ? readGuide(rootDir, guidePath) : '',
} = {}) {
  const issues = [];
  const passed = [];

  if (!text) {
    issues.push(`${guidePath} is missing`);
  }

  REQUIRED_SCREENSHOTS.forEach((filename) => {
    if (text.includes(`\`${filename}\``)) {
      passed.push(filename);
      return;
    }

    issues.push(`${guidePath} is missing required screenshot ${filename}`);
  });

  REQUIRED_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(text)) {
      passed.push(label);
      return;
    }

    issues.push(`${guidePath} is missing ${label}`);
  });

  return {
    ok: issues.length === 0,
    passed,
    issues,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditScreenshotGuide();

  if (result.ok) {
    console.log(`Screenshot guide check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Screenshot guide check failed:');
  result.issues.forEach((issue) => {
    console.error(`- ${issue}`);
  });
  process.exit(1);
}
