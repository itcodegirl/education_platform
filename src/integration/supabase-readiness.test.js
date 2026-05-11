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
      'reward trust boundary hardening migration: server-derived XP',
      'reward trust boundary hardening migration: forged XP rejection',
      'profile safe-field hardening migration: safe profile update grant',
      'Supabase production readiness docs: live deployment checklist',
      'Supabase production readiness docs: RLS smoke checks',
      'migration inventory: unique timestamp prefixes',
    ]));
  });
});
