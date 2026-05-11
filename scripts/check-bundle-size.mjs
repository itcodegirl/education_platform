/* global console, process */
import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
const indexHtmlPath = path.resolve(process.cwd(), 'dist', 'index.html');

const INITIAL_JS_BUDGET_KB = 320;
const INITIAL_CSS_BUDGET_KB = 45;

const budgets = [
  {
    label: 'main app chunk',
    match: (file) => /^index-.*\.js$/i.test(file),
    maxKb: 220,
  },
  {
    label: 'monaco editor api lazy chunk',
    match: (file) => /^vendor-monaco-editor-api-.*\.js$/i.test(file),
    maxKb: 1900,
  },
  {
    label: 'monaco/editor chunk',
    match: (file) => /^vendor-monaco-.*\.js$/i.test(file),
    maxKb: 1900,
  },
  {
    label: 'general chunk',
    match: () => true,
    maxKb: 700,
  },
];

const bannedInitialAssetPatterns = [
  {
    label: 'Monaco editor assets',
    match: (file) => /^vendor-monaco-.*\.(js|css)$/i.test(file),
  },
  {
    label: 'Supabase vendor preload',
    match: (file) => /^vendor-supabase-.*\.js$/i.test(file),
  },
  {
    label: 'Protected learning shell chunk',
    match: (file) => /^ProtectedAppRoutes-.*\.js$/i.test(file),
  },
  {
    label: 'Protected app CSS bundle',
    match: (file) => /^App-.*\.css$/i.test(file),
  },
];

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

function extractAssetRefs(html, tagPattern) {
  return Array.from(
    html.matchAll(tagPattern),
    (match) => match[1],
  );
}

function getAssetSize(file) {
  const fullPath = path.join(assetsDir, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Bundle budget check failed: missing asset "${file}" referenced by dist/index.html.`);
  }
  return fs.statSync(fullPath).size;
}

if (!fs.existsSync(assetsDir)) {
  console.error('Bundle budget check failed: dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Bundle budget check failed: dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const entryScripts = extractAssetRefs(
  indexHtml,
  /<script\b[^>]*\bsrc=["']\/assets\/([^"']+)["'][^>]*><\/script>/gi,
);
const modulePreloads = extractAssetRefs(
  indexHtml,
  /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']\/assets\/([^"']+)["'][^>]*>/gi,
);
const stylesheets = extractAssetRefs(
  indexHtml,
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']\/assets\/([^"']+)["'][^>]*>/gi,
);

const initialJsAssets = [...new Set([...entryScripts, ...modulePreloads])];
const initialCssAssets = [...new Set(stylesheets)];
const initialAssets = [...new Set([...initialJsAssets, ...initialCssAssets])];

const bannedInitialAssets = initialAssets
  .map((file) => ({
    file,
    matches: bannedInitialAssetPatterns.filter(({ match }) => match(file)),
  }))
  .filter((entry) => entry.matches.length > 0);

if (bannedInitialAssets.length > 0) {
  console.error('Bundle budget check failed: the public entry is preloading protected or editor-only assets.');
  bannedInitialAssets.forEach(({ file, matches }) => {
    const labels = matches.map(({ label }) => label).join(', ');
    console.error(`- ${file}: ${labels}`);
  });
  process.exit(1);
}

const initialJsBytes = initialJsAssets.reduce((sum, file) => sum + getAssetSize(file), 0);
const initialCssBytes = initialCssAssets.reduce((sum, file) => sum + getAssetSize(file), 0);

console.log(`Initial JS: ${formatKb(initialJsBytes)} (budget ${INITIAL_JS_BUDGET_KB} kB)`);
console.log(`Initial CSS: ${formatKb(initialCssBytes)} (budget ${INITIAL_CSS_BUDGET_KB} kB)`);

if (initialJsBytes / 1024 > INITIAL_JS_BUDGET_KB) {
  console.error(
    `Bundle budget check failed: initial JS ${formatKb(initialJsBytes)} exceeds ${INITIAL_JS_BUDGET_KB} kB.`,
  );
  process.exit(1);
}

if (initialCssBytes / 1024 > INITIAL_CSS_BUDGET_KB) {
  console.error(
    `Bundle budget check failed: initial CSS ${formatKb(initialCssBytes)} exceeds ${INITIAL_CSS_BUDGET_KB} kB.`,
  );
  process.exit(1);
}

const jsFiles = fs
  .readdirSync(assetsDir)
  .filter((file) => file.toLowerCase().endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('Bundle budget check failed: no JavaScript assets found in dist/assets.');
  process.exit(1);
}

const sizeReport = jsFiles.map((file) => {
  const sizeBytes = getAssetSize(file);
  const budget = budgets.find(({ match }) => match(file));

  return {
    file,
    sizeBytes,
    budget,
    overByKb: sizeBytes / 1024 - budget.maxKb,
  };
});

const failures = sizeReport.filter((entry) => entry.overByKb > 0);

sizeReport
  .slice()
  .sort((a, b) => b.sizeBytes - a.sizeBytes)
  .slice(0, 8)
  .forEach((entry, index) => {
    const marker = failures.includes(entry) ? 'FAIL' : 'OK';
    console.log(
      `${String(index + 1).padStart(2, '0')}. [${marker}] ${entry.file} -> ${formatKb(entry.sizeBytes)} (budget ${entry.budget.maxKb} kB: ${entry.budget.label})`,
    );
  });

if (failures.length > 0) {
  console.error('\nBundle budget check failed for:');
  failures.forEach((entry) => {
    console.error(
      `- ${entry.file}: ${formatKb(entry.sizeBytes)} exceeds ${entry.budget.maxKb} kB by ${entry.overByKb.toFixed(2)} kB`,
    );
  });
  process.exit(1);
}

console.log('\nBundle budget check passed.');
