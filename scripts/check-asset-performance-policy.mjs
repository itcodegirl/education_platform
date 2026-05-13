/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DOC_PATH = 'docs/asset-performance-policy.md';

const REQUIRED_SECTIONS = Object.freeze([
  '## Image Rules',
  '## Font Rules',
  '## Preload Rules',
  '## Media And Download Rules',
  '## Review Checklist',
  '## Escalation Rules',
  '## Automated Size Audit',
]);

const REQUIRED_PATTERNS = Object.freeze([
  {
    label: 'compressed image budget',
    pattern: /under 180 kB compressed/,
  },
  {
    label: 'small repeated image budget',
    pattern: /under 80 kB compressed/,
  },
  {
    label: 'stable image dimensions',
    pattern: /width.*height.*aspect-ratio/s,
  },
  {
    label: 'font preload boundary',
    pattern: /Do not preload fonts unless/i,
  },
  {
    label: 'forbidden dependency preloads',
    pattern: /Do not preload Monaco, Supabase, `jspdf`, `html2canvas`/,
  },
  {
    label: 'performance audit command',
    pattern: /npm run audit:performance/,
  },
  {
    label: 'asset size audit command',
    pattern: /npm run audit:asset-sizes/,
  },
  {
    label: 'font size budget',
    pattern: /Font.*120 kB/s,
  },
]);

function readText(rootDir, relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

export function auditAssetPerformancePolicy({
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
  const result = auditAssetPerformancePolicy();

  if (result.ok) {
    console.log(`Asset performance policy check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Asset performance policy check failed:');
  result.issues.forEach((issue) => {
    console.error(`- ${issue}`);
  });
  process.exit(1);
}
