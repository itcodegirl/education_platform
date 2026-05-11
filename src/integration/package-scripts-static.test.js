import { describe, expect, it } from 'vitest';
import { checkPackageScripts } from '../../scripts/check-package-scripts.mjs';

describe('package scripts', () => {
  it('does not declare duplicate script names', async () => {
    const result = await checkPackageScripts();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
