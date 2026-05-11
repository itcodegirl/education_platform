/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
const indexHtmlPath = path.resolve(process.cwd(), 'dist', 'index.html');

const budgets = [
  {
    label: 'main app chunk',
    match: (file) => /^index-.*\.js$/i.test(file),
    maxKb: 550,
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

const INITIAL_JS_GZIP_BUDGET_KB = 170;
const INITIAL_CSS_GZIP_BUDGET_KB = 12;

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

if (!fs.existsSync(assetsDir)) {
  console.error('Bundle budget check failed: dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Bundle budget check failed: dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

function collectTags(pattern) {
  return Array.from(indexHtml.matchAll(pattern), (match) => match[0]);
}

function collectAssetUrls(pattern) {
  return Array.from(indexHtml.matchAll(pattern), (match) => match[1]);
}

function assetUrlToPath(assetUrl) {
  if (!assetUrl || !assetUrl.startsWith('/assets/')) return null;
  return path.resolve(process.cwd(), 'dist', assetUrl.replace(/^\//, ''));
}

function getAssetGzipSize(assetUrl) {
  const assetPath = assetUrlToPath(assetUrl);
  if (!assetPath || !fs.existsSync(assetPath)) return 0;
  return zlib.gzipSync(fs.readFileSync(assetPath)).length;
}

const preloadedMonacoChunks = collectTags(
  /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["'][^"']*vendor-monaco-[^"']+\.js["'][^>]*>/gi,
);
const preloadedSupabaseChunks = collectTags(
  /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["'][^"']*vendor-supabase-[^"']+\.js["'][^>]*>/gi,
);
const linkedMonacoCss = collectTags(
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'][^"']*vendor-monaco-[^"']+\.css["'][^>]*>/gi,
);
const linkedProtectedCss = collectTags(
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'][^"']*App-[^"']+\.css["'][^>]*>/gi,
);

if (preloadedMonacoChunks.length > 0) {
  console.error('Bundle budget check failed: Monaco editor chunks must stay lazy.');
  preloadedMonacoChunks.forEach((tag) => {
    console.error(`- Unexpected initial Monaco preload: ${tag}`);
  });
  process.exit(1);
}

if (preloadedSupabaseChunks.length > 0) {
  console.error('Bundle budget check failed: Supabase should not preload on the public entry path.');
  preloadedSupabaseChunks.forEach((tag) => {
    console.error(`- Unexpected initial Supabase preload: ${tag}`);
  });
  process.exit(1);
}

if (linkedMonacoCss.length > 0) {
  console.error('Bundle budget check failed: Monaco CSS must stay off the public entry HTML.');
  linkedMonacoCss.forEach((tag) => {
    console.error(`- Unexpected initial Monaco stylesheet: ${tag}`);
  });
  process.exit(1);
}

if (linkedProtectedCss.length > 0) {
  console.error('Bundle budget check failed: protected app CSS must stay lazy.');
  linkedProtectedCss.forEach((tag) => {
    console.error(`- Unexpected initial protected stylesheet: ${tag}`);
  });
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
  const fullPath = path.join(assetsDir, file);
  const sizeBytes = fs.statSync(fullPath).size;
  const budget = budgets.find(({ match }) => match(file));

  return {
    file,
    sizeBytes,
    sizeKb: sizeBytes / 1024,
    budget,
    overByKb: sizeBytes / 1024 - budget.maxKb,
  };
});

const failures = sizeReport.filter((entry) => entry.overByKb > 0);

const initialScriptUrls = collectAssetUrls(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi);
const initialModulePreloadUrls = collectAssetUrls(/<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi);
const initialStylesheetUrls = collectAssetUrls(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi);

const initialJsGzipBytes = [...new Set([...initialScriptUrls, ...initialModulePreloadUrls])]
  .reduce((total, assetUrl) => total + getAssetGzipSize(assetUrl), 0);
const initialCssGzipBytes = [...new Set(initialStylesheetUrls)]
  .reduce((total, assetUrl) => total + getAssetGzipSize(assetUrl), 0);

if (initialJsGzipBytes / 1024 > INITIAL_JS_GZIP_BUDGET_KB) {
  console.error(
    `Bundle budget check failed: initial JS gzip ${formatKb(initialJsGzipBytes)} exceeds ${INITIAL_JS_GZIP_BUDGET_KB} kB.`,
  );
  process.exit(1);
}

if (initialCssGzipBytes / 1024 > INITIAL_CSS_GZIP_BUDGET_KB) {
  console.error(
    `Bundle budget check failed: initial CSS gzip ${formatKb(initialCssGzipBytes)} exceeds ${INITIAL_CSS_GZIP_BUDGET_KB} kB.`,
  );
  process.exit(1);
}

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
console.log(`Initial JS gzip: ${formatKb(initialJsGzipBytes)} (budget ${INITIAL_JS_GZIP_BUDGET_KB} kB)`);
console.log(`Initial CSS gzip: ${formatKb(initialCssGzipBytes)} (budget ${INITIAL_CSS_GZIP_BUDGET_KB} kB)`);
