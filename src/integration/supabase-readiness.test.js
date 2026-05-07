import { describe, expect, it } from 'vitest';
import { checkSupabaseReadiness } from '../../scripts/check-supabase-readiness.mjs';

describe('Supabase production readiness static checks', () => {
  it('keeps stable resume, public profile privacy, and reward ledger migrations present', async () => {
    const result = await checkSupabaseReadiness();

    expect(result.failures).toEqual([]);
    expect(result.passed).toEqual(expect.arrayContaining([
      'stable resume migration: course_id additive column',
      'stable resume migration: lesson_id additive column',
      'public profile privacy migration: progress anon revoke',
      'reward event ledger migration: reward event idempotency key',
      'atomic reward RPC migration: auth-owned user id',
      'profile safe-field hardening migration: safe profile update grant',
      'migration inventory: unique timestamp prefixes',
    ]));
  });
});
