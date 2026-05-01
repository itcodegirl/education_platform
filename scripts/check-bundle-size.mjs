/* global console, process */
import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');

const budgets = [
  {
    label: 'main app chunk',
    match: (file) => /^index-.*\.js$/i.test(file),
    maxKb: 550,
  },
  {
    label: 'monaco/editor chunk',
    match: (file) => /^vendor-monaco-.*\.js$/i.test(file),
    maxKb: 1100,
  },
  {
    label: 'general chunk',
    match: () => true,
    maxKb: 700,
  },
];

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

if (!fs.existsSync(assetsDir)) {
  console.error('Bundle budget check failed: dist/assets not found. Run `npm run build` first.');
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
