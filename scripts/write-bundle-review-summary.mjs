/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_INPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-summary.json');
const DEFAULT_BASE_INPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-summary.base.json');
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-review-summary.md');

function formatKb(value) {
  return `${Number(value).toFixed(2)} kB`;
}

function formatHeadroom(actual, budget) {
  return `${formatKb(Math.max(0, budget - actual))} remaining`;
}

function formatChange(current, base) {
  if (!Number.isFinite(base)) return 'No base';
  const change = Number((current - base).toFixed(2));
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatKb(change)}`;
}

function getFailureCount(summary) {
  return Object.values(summary.failures || {}).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return count;
  }, 0);
}

export function createBundleReviewSummary(summary, { topChunkCount = 8 } = {}) {
  return createBundleReviewSummaryWithBaseline({ summary, topChunkCount });
}

export function createBundleReviewSummaryWithBaseline({
  summary,
  baseSummary = null,
  topChunkCount = 8,
} = {}) {
  const failureCount = getFailureCount(summary);
  const status = failureCount === 0 ? 'Passing' : `${failureCount} issue${failureCount === 1 ? '' : 's'} found`;
  const topChunks = (summary.topChunks || []).slice(0, topChunkCount);
  const baseChunksByFile = new Map((baseSummary?.topChunks || []).map((chunk) => [chunk.file, chunk]));
  const lines = [
    '## Bundle Review Summary',
    '',
    `Status: ${status}`,
    `Generated: ${summary.generatedAt || 'unknown'}`,
    `Baseline: ${baseSummary ? (baseSummary.generatedAt || 'provided') : 'not provided'}`,
    '',
    '| Metric | Actual | Budget | Headroom | Change vs base |',
    '| --- | ---: | ---: | ---: | ---: |',
    `| Initial JS gzip | ${formatKb(summary.initial.jsGzipKb)} | ${formatKb(summary.initial.jsGzipBudgetKb)} | ${formatHeadroom(summary.initial.jsGzipKb, summary.initial.jsGzipBudgetKb)} | ${formatChange(summary.initial.jsGzipKb, baseSummary?.initial?.jsGzipKb)} |`,
    `| Initial CSS gzip | ${formatKb(summary.initial.cssGzipKb)} | ${formatKb(summary.initial.cssGzipBudgetKb)} | ${formatHeadroom(summary.initial.cssGzipKb, summary.initial.cssGzipBudgetKb)} | ${formatChange(summary.initial.cssGzipKb, baseSummary?.initial?.cssGzipKb)} |`,
    '',
    '### Largest Lazy/Route Chunks',
    '',
    '| Chunk | Gzip | Change vs base | Budget |',
    '| --- | ---: | ---: | --- |',
  ];

  topChunks.forEach((chunk) => {
    const budgetParts = [formatKb(chunk.budget.maxKb)];
    if (chunk.budget.gzipMaxKb) {
      budgetParts.push(`${formatKb(chunk.budget.gzipMaxKb)} gzip`);
    }
    const baseChunk = baseChunksByFile.get(chunk.file);
    lines.push(`| \`${chunk.file}\` | ${formatKb(chunk.gzipKb)} | ${formatChange(chunk.gzipKb, baseChunk?.gzipKb)} | ${chunk.budget.label} (${budgetParts.join(', ')}) |`);
  });

  lines.push(
    '',
    'Review notes:',
    '- Keep editor, export, Supabase, and course-data chunks lazy unless a user action needs them.',
    '- Do not raise budgets to pass CI; split route data or route-owned CSS first.',
    '- Use the Lighthouse artifacts for LCP, CLS, INP/TBT, accessibility, and mobile regressions.',
    '',
  );

  return lines.join('\n');
}

export function writeBundleReviewSummary({
  inputPath = DEFAULT_INPUT_PATH,
  baseInputPath = process.env.BUNDLE_BASE_SUMMARY_PATH || DEFAULT_BASE_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const summary = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const baseSummary = fs.existsSync(baseInputPath)
    ? JSON.parse(fs.readFileSync(baseInputPath, 'utf8'))
    : null;
  const markdown = createBundleReviewSummaryWithBaseline({ summary, baseSummary });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);

  return { markdown, outputPath, summary };
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const { markdown, outputPath } = writeBundleReviewSummary();
  console.log(markdown);
  console.log(`Bundle review summary written to ${path.relative(process.cwd(), outputPath)}`);
}
