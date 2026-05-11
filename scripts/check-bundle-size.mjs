/* global console, process */
import path from 'node:path';
import {
  collectBundleBudgetReport,
  formatKb,
  INITIAL_ENTRY_BUDGETS,
} from './bundleBudgetPolicy.mjs';

const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
const indexHtmlPath = path.resolve(process.cwd(), 'dist', 'index.html');

const report = collectBundleBudgetReport({ assetsDir, indexHtmlPath });

if (report.fatalErrors.length > 0) {
  report.fatalErrors.forEach((message) => {
    console.error(`Bundle budget check failed: ${message}`);
  });
  process.exit(1);
}

if (report.forbiddenPreloadFailures.length > 0) {
  console.error('Bundle budget check failed: lazy/protected assets were unexpectedly referenced by the entry HTML.');
  report.forbiddenPreloadFailures.forEach((failure) => {
    console.error(`- ${failure.label}: ${failure.tag}`);
  });
  process.exit(1);
}

if (report.missingRequiredFailures.length > 0) {
  console.error('Bundle budget check failed: required build artifacts were not found.');
  report.missingRequiredFailures.forEach((label) => {
    console.error(`- Missing ${label}`);
  });
  process.exit(1);
}

if (report.initialBudgetFailures.length > 0) {
  report.initialBudgetFailures.forEach((failure) => {
    console.error(
      `Bundle budget check failed: ${failure.label} ${formatKb(failure.actualBytes)} exceeds ${failure.maxKb} kB.`,
    );
  });
  process.exit(1);
}

report.sizeReport
  .slice()
  .sort((a, b) => b.sizeBytes - a.sizeBytes)
  .slice(0, 10)
  .forEach((entry, index) => {
    const marker = report.sizeFailures.includes(entry) ? 'FAIL' : 'OK';
    const gzipBudget = entry.budget.gzipMaxKb ? `, gzip budget ${entry.budget.gzipMaxKb} kB` : '';
    console.log(
      `${String(index + 1).padStart(2, '0')}. [${marker}] ${entry.file} -> ${formatKb(entry.sizeBytes)} raw, ${formatKb(entry.gzipBytes)} gzip (budget ${entry.budget.maxKb} kB${gzipBudget}: ${entry.budget.label})`,
    );
  });

if (report.sizeFailures.length > 0) {
  console.error('\nBundle budget check failed for:');
  report.sizeFailures.forEach((entry) => {
    const rawMessage = entry.rawOverByKb > 0
      ? `raw exceeds ${entry.budget.maxKb} kB by ${entry.rawOverByKb.toFixed(2)} kB`
      : null;
    const gzipMessage = entry.gzipOverByKb > 0
      ? `gzip exceeds ${entry.budget.gzipMaxKb} kB by ${entry.gzipOverByKb.toFixed(2)} kB`
      : null;
    console.error(`- ${entry.file}: ${[rawMessage, gzipMessage].filter(Boolean).join('; ')}`);
  });
  process.exit(1);
}

console.log('\nBundle budget check passed.');
console.log(`Initial JS gzip: ${formatKb(report.initialJsGzipBytes)} (budget ${INITIAL_ENTRY_BUDGETS.jsGzipKb} kB)`);
console.log(`Initial CSS gzip: ${formatKb(report.initialCssGzipBytes)} (budget ${INITIAL_ENTRY_BUDGETS.cssGzipKb} kB)`);
