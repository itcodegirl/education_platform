/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOTS = Object.freeze(['public', 'src']);
const ASSET_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
]);

const ASSET_BUDGETS = Object.freeze({
  image: 180,
  font: 120,
  media: 800,
  document: 500,
});

function toKb(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function classifyAsset(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)) {
    return 'image';
  }

  if (['.otf', '.ttf', '.woff', '.woff2'].includes(extension)) {
    return 'font';
  }

  if (['.mov', '.mp4', '.webm'].includes(extension)) {
    return 'media';
  }

  if (extension === '.pdf') {
    return 'document';
  }

  return null;
}

function walkAssets(rootDir, relativeRoot, files = []) {
  const absoluteRoot = path.join(rootDir, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return files;

  fs.readdirSync(absoluteRoot, { withFileTypes: true }).forEach((entry) => {
    const relativePath = path.join(relativeRoot, entry.name);

    if (entry.isDirectory()) {
      walkAssets(rootDir, relativePath, files);
      return;
    }

    if (!entry.isFile()) return;

    const extension = path.extname(entry.name).toLowerCase();
    if (ASSET_EXTENSIONS.has(extension)) {
      files.push(relativePath.replaceAll(path.sep, '/'));
    }
  });

  return files;
}

export function auditAssetSizes({
  rootDir = process.cwd(),
  roots = DEFAULT_ROOTS,
  budgets = ASSET_BUDGETS,
} = {}) {
  const assets = roots.flatMap((root) => walkAssets(rootDir, root));
  const entries = assets.map((file) => {
    const type = classifyAsset(file);
    const sizeBytes = fs.statSync(path.join(rootDir, file)).size;
    const budgetKb = budgets[type];

    return {
      file,
      type,
      sizeKb: toKb(sizeBytes),
      budgetKb,
      overByKb: Number(Math.max(0, toKb(sizeBytes) - budgetKb).toFixed(2)),
    };
  });

  const failures = entries.filter((entry) => entry.budgetKb && entry.sizeKb > entry.budgetKb);

  return {
    ok: failures.length === 0,
    checked: entries.length,
    entries,
    failures,
    budgets,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = auditAssetSizes();

  if (result.ok) {
    console.log(`Asset size audit passed (${result.checked} files checked).`);
    process.exit(0);
  }

  console.error('Asset size audit failed:');
  result.failures.forEach((failure) => {
    console.error(
      `- ${failure.file}: ${failure.sizeKb} kB exceeds ${failure.type} budget ${failure.budgetKb} kB by ${failure.overByKb} kB`,
    );
  });
  process.exit(1);
}
