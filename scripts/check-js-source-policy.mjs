import fs from 'node:fs';
import path from 'node:path';

const ROOT = globalThis.process.cwd();
const BLOCKED_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORE_DIRS = new Set([
  '.git',
  '.netlify',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'codeherway-v2',
]);
const IGNORE_FILES = new Set(['vite-env.d.ts']);

const offenders = [];

function walk(currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const absolute = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    if (!entry.isFile()) continue;
    if (IGNORE_FILES.has(entry.name)) continue;

    const ext = path.extname(entry.name);
    if (!BLOCKED_EXTENSIONS.has(ext)) continue;

    offenders.push(path.relative(ROOT, absolute).replace(/\\/g, '/'));
  }
}

walk(ROOT);

if (offenders.length > 0) {
  globalThis.console.error('Non-JS source files are not allowed in this JS-first repository.');
  for (const file of offenders) {
    globalThis.console.error(` - ${file}`);
  }
  globalThis.process.exit(1);
}

globalThis.console.log('No .ts/.tsx files found. JS-only policy passed.');
