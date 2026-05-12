/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DOC_PATH = 'docs/lighthouse-evidence.md';
const DEFAULT_CONFIG_PATH = 'lighthouserc.json';

const REQUIRED_SECTIONS = Object.freeze([
  '## Current Capture Status',
  '## CI Evidence Workflow',
  '## Local Capture',
  '## Minimum Scores',
  '## Result Template',
  '## Reviewer Note',
]);

const REQUIRED_DOC_PATTERNS = Object.freeze([
  {
    label: 'artifact path',
    pattern: /\.lighthouseci\//,
  },
  {
    label: 'honest no-score boundary',
    pattern: /Do not claim measured Lighthouse performance/i,
  },
  {
    label: 'build command',
    pattern: /npm run build/,
  },
  {
    label: 'lighthouse command',
    pattern: /npm run test:lighthouse/,
  },
]);

const SCORE_LABELS = Object.freeze({
  'categories:performance': 'Performance',
  'categories:accessibility': 'Accessibility',
  'categories:best-practices': 'Best practices',
  'categories:seo': 'SEO',
});

function readText(rootDir, relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function collectConfiguredScoreIssues({ configText, docText }) {
  const config = JSON.parse(configText);
  const assertions = config?.ci?.assert?.assertions || {};

  return Object.entries(SCORE_LABELS).flatMap(([assertionName, label]) => {
    const minScore = assertions?.[assertionName]?.[1]?.minScore;
    if (!Number.isFinite(minScore)) {
      return [`lighthouserc is missing ${assertionName} minScore`];
    }

    const expectedLine = `${label}: \`${minScore.toFixed(2)}\``;
    return docText.includes(expectedLine)
      ? []
      : [`docs/lighthouse-evidence.md is missing "${expectedLine}"`];
  });
}

export function auditLighthouseEvidence({
  rootDir = process.cwd(),
  docPath = DEFAULT_DOC_PATH,
  configPath = DEFAULT_CONFIG_PATH,
  docText = existsSync(path.join(rootDir, docPath)) ? readText(rootDir, docPath) : '',
  configText = readText(rootDir, configPath),
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

  REQUIRED_DOC_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(docText)) {
      passed.push(label);
      return;
    }

    issues.push(`${docPath} is missing ${label}`);
  });

  const scoreIssues = collectConfiguredScoreIssues({ configText, docText });
  if (scoreIssues.length) {
    issues.push(...scoreIssues);
  } else {
    passed.push('configured Lighthouse score thresholds');
  }

  return {
    ok: issues.length === 0,
    passed,
    issues,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditLighthouseEvidence();

  if (result.ok) {
    console.log(`Lighthouse evidence check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Lighthouse evidence check failed:');
  result.issues.forEach((issue) => {
    console.error(`- ${issue}`);
  });
  process.exit(1);
}
