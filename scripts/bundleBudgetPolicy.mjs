import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const DEFAULT_BUNDLE_BUDGETS = [
  {
    label: 'main app chunk',
    match: (file) => /^index-.*\.js$/i.test(file),
    maxKb: 380,
    gzipMaxKb: 120,
    required: true,
  },
  {
    label: 'initial stylesheet',
    match: (file) => /^index-.*\.css$/i.test(file),
    maxKb: 230,
    gzipMaxKb: 45,
    required: true,
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
    label: 'protected app stylesheet lazy chunk',
    match: (file) => /^App-.*\.css$/i.test(file),
    maxKb: 200,
    gzipMaxKb: 35,
  },
  {
    label: 'PDF export lazy chunk',
    match: (file) => /^jspdf.*\.js$/i.test(file),
    maxKb: 450,
    gzipMaxKb: 150,
  },
  {
    label: 'canvas export lazy chunk',
    match: (file) => /^html2canvas.*\.js$/i.test(file),
    maxKb: 230,
    gzipMaxKb: 60,
  },
  {
    label: 'course runtime data lazy chunk',
    match: (file) => /^data-(html|css|js|react)-(?!challenges)[^.]+\.js$/i.test(file),
    maxKb: 260,
    gzipMaxKb: 80,
  },
  {
    label: 'general JavaScript chunk',
    match: (file) => file.toLowerCase().endsWith('.js'),
    maxKb: 700,
  },
  {
    label: 'general stylesheet chunk',
    match: (file) => file.toLowerCase().endsWith('.css'),
    maxKb: 120,
    gzipMaxKb: 25,
  },
];

export const FORBIDDEN_MODULE_PRELOADS = [
  {
    label: 'Monaco editor chunks',
    rel: 'modulepreload',
    pattern: /vendor-monaco-[^"']+\.js/i,
  },
  {
    label: 'Supabase chunks',
    rel: 'modulepreload',
    pattern: /vendor-supabase-[^"']+\.js/i,
  },
  {
    label: 'export-only PDF/canvas chunks',
    rel: 'modulepreload',
    pattern: /(?:jspdf|html2canvas)[^"']+\.js/i,
  },
  {
    label: 'Monaco stylesheets',
    rel: 'stylesheet',
    pattern: /vendor-monaco-[^"']+\.css/i,
  },
  {
    label: 'protected app stylesheets',
    rel: 'stylesheet',
    pattern: /App-[^"']+\.css/i,
  },
  {
    label: 'public auth route chunks',
    rel: 'modulepreload',
    pattern: /(?:AuthLayout|LandingHero)-[^"']+\.js/i,
  },
];

export const INITIAL_ENTRY_BUDGETS = {
  jsGzipKb: 95,
  cssGzipKb: 12,
};

export const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

function readAssetSize(fullPath) {
  const contents = fs.readFileSync(fullPath);
  return {
    sizeBytes: contents.length,
    gzipBytes: zlib.gzipSync(contents).length,
  };
}

function findBudget(file, budgets) {
  return budgets.find(({ match }) => match(file));
}

function collectAssetUrls(indexHtml, pattern) {
  return Array.from(indexHtml.matchAll(pattern), (match) => match[1]);
}

function getIndexReferences(indexHtml) {
  const links = Array.from(
    indexHtml.matchAll(/<link\b[^>]*\brel=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi),
    (match) => ({ tag: match[0], rel: match[1].toLowerCase(), href: match[2] }),
  );

  const scripts = Array.from(
    indexHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi),
    (match) => ({ tag: match[0], rel: 'script', href: match[1] }),
  );

  return [...links, ...scripts];
}

function getForbiddenPreloads(indexHtml, forbiddenPreloads) {
  const references = getIndexReferences(indexHtml);

  return references.flatMap(({ tag, rel, href }) =>
    forbiddenPreloads
      .filter((rule) => rule.rel === rel && rule.pattern.test(href))
      .map(({ label }) => ({ label, tag })),
  );
}

function getAssetGzipSize({ assetUrl, distDir }) {
  if (!assetUrl || !assetUrl.startsWith('/assets/')) return 0;
  const assetPath = path.resolve(distDir, assetUrl.replace(/^\//, ''));
  if (!fs.existsSync(assetPath)) return 0;
  return zlib.gzipSync(fs.readFileSync(assetPath)).length;
}

function getInitialEntrySizes({ indexHtml, distDir }) {
  const initialScriptUrls = collectAssetUrls(
    indexHtml,
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,
  );
  const initialModulePreloadUrls = collectAssetUrls(
    indexHtml,
    /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
  );
  const initialStylesheetUrls = collectAssetUrls(
    indexHtml,
    /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
  );

  const initialJsGzipBytes = [...new Set([...initialScriptUrls, ...initialModulePreloadUrls])]
    .reduce((total, assetUrl) => total + getAssetGzipSize({ assetUrl, distDir }), 0);
  const initialCssGzipBytes = [...new Set(initialStylesheetUrls)]
    .reduce((total, assetUrl) => total + getAssetGzipSize({ assetUrl, distDir }), 0);

  return { initialJsGzipBytes, initialCssGzipBytes };
}

export function collectBundleBudgetReport({
  assetsDir,
  indexHtmlPath,
  budgets = DEFAULT_BUNDLE_BUDGETS,
  forbiddenPreloads = FORBIDDEN_MODULE_PRELOADS,
  initialEntryBudgets = INITIAL_ENTRY_BUDGETS,
}) {
  const fatalErrors = [];

  if (!fs.existsSync(assetsDir)) {
    fatalErrors.push('dist/assets not found. Run `npm run build` first.');
  }

  if (!fs.existsSync(indexHtmlPath)) {
    fatalErrors.push('dist/index.html not found. Run `npm run build` first.');
  }

  if (fatalErrors.length > 0) {
    return {
      fatalErrors,
      forbiddenPreloadFailures: [],
      missingRequiredFailures: [],
      initialBudgetFailures: [],
      initialJsGzipBytes: 0,
      initialCssGzipBytes: 0,
      sizeReport: [],
      sizeFailures: [],
    };
  }

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const distDir = path.dirname(indexHtmlPath);
  const assetFiles = fs
    .readdirSync(assetsDir)
    .filter((file) => /\.(css|js)$/i.test(file));
  const { initialJsGzipBytes, initialCssGzipBytes } = getInitialEntrySizes({
    indexHtml,
    distDir,
  });

  const sizeReport = assetFiles.flatMap((file) => {
    const budget = findBudget(file, budgets);
    if (!budget) return [];

    const fullPath = path.join(assetsDir, file);
    const { sizeBytes, gzipBytes } = readAssetSize(fullPath);
    const sizeKb = sizeBytes / 1024;
    const gzipKb = gzipBytes / 1024;

    return [{
      file,
      sizeBytes,
      gzipBytes,
      sizeKb,
      gzipKb,
      budget,
      rawOverByKb: sizeKb - budget.maxKb,
      gzipOverByKb: budget.gzipMaxKb ? gzipKb - budget.gzipMaxKb : 0,
    }];
  });

  const sizeFailures = sizeReport.filter((entry) =>
    entry.rawOverByKb > 0 || entry.gzipOverByKb > 0,
  );

  const missingRequiredFailures = budgets
    .filter((budget) => budget.required)
    .filter((budget) => !assetFiles.some((file) => budget.match(file)))
    .map((budget) => budget.label);
  const initialBudgetFailures = [
    initialJsGzipBytes / 1024 > initialEntryBudgets.jsGzipKb
      ? {
        label: 'initial JS gzip',
        actualBytes: initialJsGzipBytes,
        maxKb: initialEntryBudgets.jsGzipKb,
      }
      : null,
    initialCssGzipBytes / 1024 > initialEntryBudgets.cssGzipKb
      ? {
        label: 'initial CSS gzip',
        actualBytes: initialCssGzipBytes,
        maxKb: initialEntryBudgets.cssGzipKb,
      }
      : null,
  ].filter(Boolean);

  return {
    fatalErrors,
    forbiddenPreloadFailures: getForbiddenPreloads(indexHtml, forbiddenPreloads),
    missingRequiredFailures,
    initialBudgetFailures,
    initialJsGzipBytes,
    initialCssGzipBytes,
    sizeReport,
    sizeFailures,
  };
}
