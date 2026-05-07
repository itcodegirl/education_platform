import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readText(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('supabase policy sql static checks', () => {
  it('profile-policy.blocks-user-editing-admin-fields statically', () => {
    const schema = readText('../../supabase-schema.sql');
    const migration = readText('../../supabase/migrations/202605060001_guard_profile_disabled_updates.sql');

    [schema, migration].forEach((sql) => {
      expect(sql).toMatch(/new\.is_admin is distinct from old\.is_admin/i);
      expect(sql).toMatch(/new\.is_disabled is distinct from old\.is_disabled/i);
      expect(sql).toMatch(/is_disabled can only be changed by an admin/i);
      expect(sql).toMatch(/before update of is_admin,\s*is_disabled on public\.profiles/i);
    });
  });

  it('reward-backend.enforces-idempotency-and-auth-owned-awards statically', () => {
    const createEventsMigration = readText('../../supabase/migrations/202604250001_create_reward_events.sql');
    const awardRpcMigration = readText('../../supabase/migrations/202604250002_add_award_reward_event_rpc.sql');
    const idempotencyGuardMigration = readText('../../supabase/migrations/202605060002_guard_reward_event_idempotency.sql');

    expect(createEventsMigration).toMatch(/unique\s*\(\s*user_id\s*,\s*event_key\s*\)/i);
    expect(idempotencyGuardMigration).toMatch(/create unique index if not exists reward_events_user_event_key_key/i);
    expect(idempotencyGuardMigration).toMatch(/on public\.reward_events\s*\(\s*user_id\s*,\s*event_key\s*\)/i);

    expect(createEventsMigration).toMatch(/alter table public\.reward_events enable row level security/i);
    expect(createEventsMigration).toMatch(/for select\s+using\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);
    expect(createEventsMigration).toMatch(/Reward writes should go through public\.award_reward_event\(\)/i);

    expect(awardRpcMigration).toMatch(/v_user_id uuid := auth\.uid\(\)/i);
    expect(awardRpcMigration).not.toMatch(/p_user_id|p_learner_id/i);
    expect(awardRpcMigration).toMatch(/if v_user_id is null then/i);
    expect(awardRpcMigration).toMatch(/on conflict\s*\(\s*user_id\s*,\s*event_key\s*\)\s*do nothing/i);
    expect(awardRpcMigration).toMatch(/grant execute on function public\.award_reward_event[\s\S]*to authenticated/i);
  });
});
