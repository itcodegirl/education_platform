import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditAssetSizes } from '../../scripts/check-asset-sizes.mjs';

const tempDirs = [];

function makeFixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chw-asset-audit-'));
  tempDirs.push(root);

  Object.entries(files).forEach(([file, sizeKb]) => {
    const absolutePath = path.join(root, file);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, Buffer.alloc(sizeKb * 1024, 'a'));
  });

  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { force: true, recursive: true });
  }
});

describe('asset size audit', () => {
  it('passes compressed assets within policy budgets', () => {
    const rootDir = makeFixture({
      'public/preview.webp': 120,
      'src/assets/app.woff2': 60,
    });

    const result = auditAssetSizes({ rootDir });

    expect(result.ok).toBe(true);
    expect(result.checked).toBe(2);
    expect(result.failures).toEqual([]);
  });

  it('flags assets that exceed their type budget', () => {
    const rootDir = makeFixture({
      'public/large-hero.png': 220,
      'src/assets/oversized-font.ttf': 150,
    });

    const result = auditAssetSizes({ rootDir });

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      expect.objectContaining({
        file: 'public/large-hero.png',
        type: 'image',
        budgetKb: 180,
      }),
      expect.objectContaining({
        file: 'src/assets/oversized-font.ttf',
        type: 'font',
        budgetKb: 120,
      }),
    ]);
  });
});
