import { describe, expect, it } from 'vitest';
import { checkRewardCatalog } from '../../scripts/check-reward-catalog.mjs';

describe('reward catalog migration', () => {
  it('stays aligned with curriculum lessons, quizzes, and challenges', async () => {
    const result = await checkRewardCatalog();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
