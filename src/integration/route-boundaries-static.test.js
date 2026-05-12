import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  checkGlobalStaticImportBoundaries,
  checkRouteBoundaries,
} from '../../scripts/check-route-boundaries.mjs';

describe('route boundary audit', () => {
  it('keeps heavy surfaces out of initial route and shell imports', () => {
    const result = checkRouteBoundaries();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('flags PDF export dependencies when they are statically imported in source files', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chw-route-boundary-'));
    fs.mkdirSync(path.join(tempRoot, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'src', 'bad-export.js'),
      "import { jsPDF } from 'jspdf';\nexport const value = jsPDF;\n",
    );

    const failures = checkGlobalStaticImportBoundaries(tempRoot);

    expect(failures).toEqual([
      expect.stringContaining('src/bad-export.js statically imports jspdf'),
    ]);
  });
});
