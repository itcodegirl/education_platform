import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectBundleBudgetReport,
  DEFAULT_BUNDLE_BUDGETS,
  INITIAL_ENTRY_BUDGETS,
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

  it('keeps export-only PDF and canvas chunks out of initial modulepreloads', () => {
    const fixture = createBundleFixture({
      indexHtml: [
        '<link rel="modulepreload" href="/assets/jspdf.es.min-lazy.js">',
        '<link rel="modulepreload" href="/assets/html2canvas-lazy.js">',
      ].join('\n'),
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'jspdf.es.min-lazy.js': 'console.log("pdf export");',
        'html2canvas-lazy.js': 'console.log("canvas export");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.forbiddenPreloadFailures).toEqual([
      expect.objectContaining({ label: 'export-only PDF/canvas chunks' }),
      expect.objectContaining({ label: 'export-only PDF/canvas chunks' }),
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

  it('keeps public auth route chunks out of the initial modulepreload list', () => {
    const fixture = createBundleFixture({
      indexHtml: [
        '<link rel="modulepreload" href="/assets/AuthLayout-public.js">',
        '<link rel="modulepreload" href="/assets/LandingHero-story.js">',
      ].join('\n'),
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'AuthLayout-public.js': 'console.log("auth");',
        'LandingHero-story.js': 'console.log("story");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.forbiddenPreloadFailures).toEqual([
      expect.objectContaining({ label: 'public auth route chunks' }),
      expect.objectContaining({ label: 'public auth route chunks' }),
    ]);
  });

  it('keeps export tooling out of the public entry HTML', () => {
    const fixture = createBundleFixture({
      indexHtml: [
        '<link rel="modulepreload" href="/assets/jspdf.es.min-export.js">',
        '<link rel="modulepreload" href="/assets/html2canvas-export.js">',
      ].join('\n'),
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'jspdf.es.min-export.js': 'console.log("pdf");',
        'html2canvas-export.js': 'console.log("canvas");',
      },
    });

    const report = collectBundleBudgetReport(fixture);

    expect(report.forbiddenPreloadFailures).toEqual([
      expect.objectContaining({ label: 'export-only PDF/canvas chunks' }),
      expect.objectContaining({ label: 'export-only PDF/canvas chunks' }),
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
    expect(appStylesheet?.budget.maxKb).toBe(200);
    expect(appStylesheet?.budget.gzipMaxKb).toBe(35);
    expect(report.sizeFailures.some((entry) => entry.file === 'App-authenticated.css')).toBe(false);
  });

  it('uses explicit lazy budgets for export-only PDF and canvas chunks', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'jspdf.es.min-lazy.js': 'a'.repeat(420 * 1024),
        'html2canvas-lazy.js': 'a'.repeat(210 * 1024),
      },
    });

    const report = collectBundleBudgetReport(fixture);
    const pdfChunk = report.sizeReport.find((entry) => entry.file === 'jspdf.es.min-lazy.js');
    const canvasChunk = report.sizeReport.find((entry) => entry.file === 'html2canvas-lazy.js');

    expect(pdfChunk?.budget.label).toBe('PDF export lazy chunk');
    expect(canvasChunk?.budget.label).toBe('canvas export lazy chunk');
    expect(report.sizeFailures.some((entry) => /jspdf|html2canvas/.test(entry.file))).toBe(false);
  });

  it('uses a dedicated budget for lazy course runtime data chunks', () => {
    const fixture = createBundleFixture({
      assets: {
        'index-app.js': 'console.log("app");',
        'index-app.css': 'body{color:white;}',
        'data-js-course.js': 'a'.repeat(250 * 1024),
      },
    });

    const report = collectBundleBudgetReport(fixture);
    const courseDataChunk = report.sizeReport.find((entry) => entry.file === 'data-js-course.js');

    expect(courseDataChunk?.budget.label).toBe('course runtime data lazy chunk');
    expect(report.sizeFailures.some((entry) => entry.file === 'data-js-course.js')).toBe(false);
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

  it('keeps the production initial JavaScript budget under 100 kB gzip', () => {
    expect(INITIAL_ENTRY_BUDGETS.jsGzipKb).toBeLessThanOrEqual(95);
  });
});
