/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DOC_PATH = 'docs/authenticated-performance-evidence.md';

const REQUIRED_SECTIONS = Object.freeze([
  '## Scope',
  '## Capture Preconditions',
  '## Required Traces',
  '## Pass Criteria',
  '## Evidence Template',
  '## Reviewer Note',
]);

const REQUIRED_PATTERNS = Object.freeze([
  {
    label: 'authenticated smoke command',
    pattern: /npm run test:e2e:smoke:authenticated/,
  },
  {
    label: 'mobile smoke command',
    pattern: /npm run test:e2e:smoke:mobile/,
  },
  {
    label: 'performance audit command',
    pattern: /npm run audit:performance/,
  },
  {
    label: 'secret handling boundary',
    pattern: /never commit learner secrets/i,
  },
  {
    label: 'Monaco lazy loading check',
    pattern: /Monaco loads only after intent/i,
  },
  {
    label: 'export lazy loading check',
    pattern: /jspdf.*html2canvas.*load only after export intent/i,
  },
  {
    label: 'honest skip boundary',
    pattern: /self-skipped instead of claiming authenticated evidence/i,
  },
]);

function readText(rootDir, relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

export function auditAuthenticatedPerformanceEvidence({
  rootDir = process.cwd(),
  docPath = DEFAULT_DOC_PATH,
  docText = existsSync(path.join(rootDir, docPath)) ? readText(rootDir, docPath) : '',
} = {}) {
  const issues = [];
  const passed = [];

  if (!docText) {
    issues.push(`${docPath} is missing`);
  }

  REQUIRED_SECTIONS.forEach((section) => {
    if (docText.includes(section)) {
      passed.push(section);
      return;
    }

    issues.push(`${docPath} is missing ${section}`);
  });

  REQUIRED_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(docText)) {
      passed.push(label);
      return;
    }

    issues.push(`${docPath} is missing ${label}`);
  });

  return {
    ok: issues.length === 0,
    passed,
    issues,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditAuthenticatedPerformanceEvidence();

  if (result.ok) {
    console.log(`Authenticated performance evidence check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Authenticated performance evidence check failed:');
  result.issues.forEach((issue) => {
    console.error(`- ${issue}`);
  });
  process.exit(1);
}
