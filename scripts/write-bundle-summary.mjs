/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  collectBundleBudgetReport,
  DEFAULT_BUNDLE_BUDGETS,
  FORBIDDEN_MODULE_PRELOADS,
  INITIAL_ENTRY_BUDGETS,
} from './bundleBudgetPolicy.mjs';

const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-summary.json');

function toKb(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function serializeBudget(budget) {
  return {
    label: budget.label,
    maxKb: budget.maxKb,
    gzipMaxKb: budget.gzipMaxKb || null,
    required: Boolean(budget.required),
  };
}

export function createBundleSummary(report, {
  generatedAt = new Date().toISOString(),
  topChunkCount = 20,
} = {}) {
  const topChunks = report.sizeReport
    .slice()
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, topChunkCount)
    .map((entry) => ({
      file: entry.file,
      rawKb: toKb(entry.sizeBytes),
      gzipKb: toKb(entry.gzipBytes),
      budget: serializeBudget(entry.budget),
      rawOverByKb: Number(Math.max(0, entry.rawOverByKb).toFixed(2)),
      gzipOverByKb: Number(Math.max(0, entry.gzipOverByKb).toFixed(2)),
    }));

  return {
    generatedAt,
    initial: {
      jsGzipKb: toKb(report.initialJsGzipBytes),
      jsGzipBudgetKb: INITIAL_ENTRY_BUDGETS.jsGzipKb,
      cssGzipKb: toKb(report.initialCssGzipBytes),
      cssGzipBudgetKb: INITIAL_ENTRY_BUDGETS.cssGzipKb,
    },
    topChunks,
    failures: {
      fatal: report.fatalErrors,
      forbiddenPreloads: report.forbiddenPreloadFailures.map(({ label, tag }) => ({ label, tag })),
      missingRequired: report.missingRequiredFailures,
      initialBudget: report.initialBudgetFailures.map(({ label, actualBytes, maxKb }) => ({
        label,
        actualKb: toKb(actualBytes),
        maxKb,
      })),
      size: report.sizeFailures.map((entry) => ({
        file: entry.file,
        budget: entry.budget.label,
        rawOverByKb: Number(Math.max(0, entry.rawOverByKb).toFixed(2)),
        gzipOverByKb: Number(Math.max(0, entry.gzipOverByKb).toFixed(2)),
      })),
    },
    policy: {
      budgets: DEFAULT_BUNDLE_BUDGETS.map(serializeBudget),
      forbiddenPreloads: FORBIDDEN_MODULE_PRELOADS.map(({ label, rel, pattern }) => ({
        label,
        rel,
        pattern: pattern.source,
      })),
    },
  };
}

export function writeBundleSummary({
  assetsDir = path.resolve(process.cwd(), 'dist', 'assets'),
  indexHtmlPath = path.resolve(process.cwd(), 'dist', 'index.html'),
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const report = collectBundleBudgetReport({ assetsDir, indexHtmlPath });
  const summary = createBundleSummary(report);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

  return { report, summary, outputPath };
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const { report, outputPath } = writeBundleSummary();

  if (report.fatalErrors.length > 0) {
    report.fatalErrors.forEach((message) => {
      console.error(`Bundle summary failed: ${message}`);
    });
    process.exit(1);
  }

  console.log(`Bundle summary written to ${path.relative(process.cwd(), outputPath)}`);
}
