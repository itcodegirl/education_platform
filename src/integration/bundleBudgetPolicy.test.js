import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectBundleBudgetReport,
  DEFAULT_BUNDLE_BUDGETS,
} from '../../scripts/bundleBudgetPolicy.mjs';

const tempDirs = [];

function createBundleFixture({ assets, indexHtml = '<html></html>' }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chw-bundle-budget-'));
  const assetsDir = path.join(root, 'assets');
  const indexHtmlPath = path.join(root, 'index.html');
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(indexHtmlPath, indexHtml);

  Object.entries(assets).forEach(([file, contents]) => {
    fs.writeFileSync(path.join(assetsDir, file), contents);
  });

  tempDirs.push(root);
  return { assetsDir, indexHtmlPath };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { force: true, recursive: true });
  }
});

describe('bundle budget policy', () => {
  it('passes a small app shell with required JS and CSS artifacts', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'vendor-monaco-editor-api-lazy.js': 'console.log("lazy editor");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.fatalErrors).toEqual([]);
    expect(report.forbiddenPreloadFailures).toEqual([]);
    expect(report.missingRequiredFailures).toEqual([]);
    expect(report.sizeFailures).toEqual([]);
  });

  it('fails when Monaco chunks are modulepreloaded into the initial page', () => {
    const fixture = createBundleFixture({
      indexHtml: '<link rel="modulepreload" href="/assets/vendor-monaco-base-lazy.js">',
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'vendor-monaco-base-lazy.js': 'console.log("lazy editor");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.forbiddenPreloadFailures).toEqual([
      expect.objectContaining({ label: 'Monaco editor chunks' }),
    ]);
  });

  it('keeps Supabase and protected styles out of the public entry HTML', () => {
    const fixture = createBundleFixture({
      indexHtml: [
        '<link rel="modulepreload" href="/assets/vendor-supabase-app.js">',
        '<link rel="stylesheet" href="/assets/App-protected.css">',
      ].join('\n'),
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'vendor-supabase-app.js': 'console.log("supabase");',
        'App-protected.css': 'body{}',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.forbiddenPreloadFailures).toEqual([
      expect.objectContaining({ label: 'Supabase chunks' }),
      expect.objectContaining({ label: 'protected app stylesheets' }),
    ]);
  });

  it('requires the initial stylesheet to stay budgeted', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.missingRequiredFailures).toContain('initial stylesheet');
  });

  it('flags raw and gzip budget regressions with explicit labels', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
        'index-bloated.css': 'a'.repeat(231 * 1024),
      },
    });

    const report = collectBundleBudgetReport(fixture);
    const cssFailure = report.sizeFailures.find((entry) => entry.file === 'index-bloated.css');
    const cssBudget = DEFAULT_BUNDLE_BUDGETS.find((budget) => budget.label === 'initial stylesheet');

    expect(cssFailure?.budget).toBe(cssBudget);
    expect(cssFailure?.rawOverByKb).toBeGreaterThan(0);
  });

  it('uses a protected app stylesheet budget for lazy authenticated CSS', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'App-authenticated.css': 'a'.repeat(180 * 1024),
      },
    });

    const report = collectBundleBudgetReport(fixture);
    const appStylesheet = report.sizeReport.find((entry) => entry.file === 'App-authenticated.css');

    expect(appStylesheet?.budget.label).toBe('protected app stylesheet lazy chunk');
    expect(report.sizeFailures.some((entry) => entry.file === 'App-authenticated.css')).toBe(false);
  });

  it('checks initial entry gzip budgets separately from lazy chunks', () => {
    const fixture = createBundleFixture({
      indexHtml: '<script type="module" src="/assets/index-app.js"></script>',
      assets: {
        'index-app.js': crypto.randomBytes(8 * 1024),
        'index-app.css': 'body{color:white;}',
      },
    });

    const report = collectBundleBudgetReport({
      ...fixture,
      initialEntryBudgets: { jsGzipKb: 1, cssGzipKb: 12 },
    });

    expect(report.initialBudgetFailures).toEqual([
      expect.objectContaining({ label: 'initial JS gzip' }),
    ]);
  });
});
