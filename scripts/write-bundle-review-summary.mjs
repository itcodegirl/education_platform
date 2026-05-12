/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_INPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-summary.json');
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'dist', 'bundle-review-summary.md');

function formatKb(value) {
  return `${Number(value).toFixed(2)} kB`;
}

function formatHeadroom(actual, budget) {
  return `${formatKb(Math.max(0, budget - actual))} remaining`;
}

function getFailureCount(summary) {
  return Object.values(summary.failures || {}).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return count;
  }, 0);
}

export function createBundleReviewSummary(summary, { topChunkCount = 8 } = {}) {
  const failureCount = getFailureCount(summary);
  const status = failureCount === 0 ? 'Passing' : `${failureCount} issue${failureCount === 1 ? '' : 's'} found`;
  const topChunks = (summary.topChunks || []).slice(0, topChunkCount);
  const lines = [
    '## Bundle Review Summary',
    '',
    `Status: ${status}`,
    `Generated: ${summary.generatedAt || 'unknown'}`,
    '',
    '| Metric | Actual | Budget | Headroom |',
    '| --- | ---: | ---: | ---: |',
    `| Initial JS gzip | ${formatKb(summary.initial.jsGzipKb)} | ${formatKb(summary.initial.jsGzipBudgetKb)} | ${formatHeadroom(summary.initial.jsGzipKb, summary.initial.jsGzipBudgetKb)} |`,
    `| Initial CSS gzip | ${formatKb(summary.initial.cssGzipKb)} | ${formatKb(summary.initial.cssGzipBudgetKb)} | ${formatHeadroom(summary.initial.cssGzipKb, summary.initial.cssGzipBudgetKb)} |`,
    '',
    '### Largest Lazy/Route Chunks',
    '',
    '| Chunk | Gzip | Budget |',
    '| --- | ---: | --- |',
  ];

  topChunks.forEach((chunk) => {
    const budgetParts = [formatKb(chunk.budget.maxKb)];
    if (chunk.budget.gzipMaxKb) {
      budgetParts.push(`${formatKb(chunk.budget.gzipMaxKb)} gzip`);
    }
    lines.push(`| \`${chunk.file}\` | ${formatKb(chunk.gzipKb)} | ${chunk.budget.label} (${budgetParts.join(', ')}) |`);
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
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const summary = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const markdown = createBundleReviewSummary(summary);

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
