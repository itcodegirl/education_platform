import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readText(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('supabase policy sql static checks', () => {
  it('profile-policy.blocks-user-editing-admin-fields statically', () => {
    const schema = readText('../../supabase-schema.sql');
    const adminGuardMigration = readText('../../supabase/migrations/202605060001_guard_profile_disabled_updates.sql');
    const safeFieldMigration = readText('../../supabase/migrations/202605060003_harden_profile_updates.sql');

    [schema, adminGuardMigration].forEach((sql) => {
      expect(sql).toMatch(/new\.is_admin is distinct from old\.is_admin/i);
      expect(sql).toMatch(/new\.is_disabled is distinct from old\.is_disabled/i);
      expect(sql).toMatch(/is_disabled can only be changed by an admin/i);
      expect(sql).toMatch(/before update of is_admin,\s*is_disabled on public\.profiles/i);
    });

    expect(safeFieldMigration).toMatch(/revoke insert,\s*update on table public\.profiles from authenticated/i);
    expect(safeFieldMigration).toMatch(/grant update\s*\(\s*display_name,\s*avatar_url,\s*is_public,\s*public_handle\s*\)/i);
    expect(safeFieldMigration).not.toMatch(/grant update\s*\([^)]*is_admin/i);
    expect(safeFieldMigration).not.toMatch(/grant update\s*\([^)]*is_disabled/i);
    expect(safeFieldMigration).toMatch(/create or replace function public\.set_user_disabled/i);
    expect(safeFieldMigration).toMatch(/grant execute on function public\.set_user_disabled[\s\S]*to authenticated/i);
  });

  it('reward-backend.enforces-idempotency-and-auth-owned-awards statically', () => {
    const createEventsMigration = readText('../../supabase/migrations/202604250001_create_reward_events.sql');
    const awardRpcMigration = readText('../../supabase/migrations/202604250002_add_award_reward_event_rpc.sql');
    const idempotencyGuardMigration = readText('../../supabase/migrations/202605060002_guard_reward_event_idempotency.sql');
    const hardenedAwardRpcMigration = readText('../../supabase/migrations/202605110001_harden_reward_event_trust_boundaries.sql');

    expect(createEventsMigration).toMatch(/unique\s*\(\s*user_id\s*,\s*event_key\s*\)/i);
    expect(idempotencyGuardMigration).toMatch(/create unique index if not exists reward_events_user_event_key_key/i);
    expect(idempotencyGuardMigration).toMatch(/on public\.reward_events\s*\(\s*user_id\s*,\s*event_key\s*\)/i);

    expect(createEventsMigration).toMatch(/alter table public\.reward_events enable row level security/i);
    expect(createEventsMigration).toMatch(/for select\s+using\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);
    expect(createEventsMigration).toMatch(/Reward writes should go through public\.award_reward_event\(\)/i);

    [awardRpcMigration, hardenedAwardRpcMigration].forEach((sql) => {
      expect(sql).toMatch(/v_user_id uuid := auth\.uid\(\)/i);
      expect(sql).not.toMatch(/p_user_id|p_learner_id/i);
      expect(sql).toMatch(/if v_user_id is null then/i);
      expect(sql).toMatch(/on conflict\s*\(\s*user_id\s*,\s*event_key\s*\)\s*do nothing/i);
      expect(sql).toMatch(/grant execute on function public\.award_reward_event[\s\S]*to authenticated/i);
    });

    expect(hardenedAwardRpcMigration).toMatch(/create table if not exists public\.reward_catalog/i);
    expect(hardenedAwardRpcMigration).toMatch(/primary key\s*\(\s*event_type\s*,\s*entity_id\s*\)/i);
    expect(hardenedAwardRpcMigration).toMatch(/revoke insert,\s*update,\s*delete on table public\.reward_catalog from anon,\s*authenticated/i);
    expect(hardenedAwardRpcMigration).toMatch(/select catalog\.xp_amount[\s\S]*into v_expected_xp/i);
    expect(hardenedAwardRpcMigration).toMatch(/unknown_reward_entity/i);
    expect(hardenedAwardRpcMigration).toMatch(/v_expected_event_key :=/i);
    expect(hardenedAwardRpcMigration).toMatch(/event_key_mismatch/i);
    expect(hardenedAwardRpcMigration).toMatch(/xp_amount_mismatch/i);
    expect(hardenedAwardRpcMigration).toMatch(/p_xp_amount is not null and p_xp_amount <> v_expected_xp/i);
    expect(hardenedAwardRpcMigration).toMatch(/values \(\s*v_user_id,\s*v_expected_xp,\s*now\(\)\s*\)/i);
  });

  it('publicProfileDoesNotExposeRawProgressRows', () => {
    const schema = readText('../../supabase-schema.sql')
      .split('-- PUBLIC PROFILE PAGES')[1] || '';
    const migration = readText('../../supabase/migrations/202605070002_harden_public_profile_privacy.sql');

    [schema, migration].forEach((sql) => {
      expect(sql).toMatch(/create or replace view public\.public_profiles/i);
      expect(sql).toMatch(/count\(\*\)::int as n[\s\S]*from public\.progress/i);
      expect(sql).toMatch(/grant select on public\.public_profiles to anon,\s*authenticated/i);
      expect(sql).toMatch(/drop policy if exists "Public progress count readable" on public\.progress/i);
      expect(sql).toMatch(/revoke select on table public\.progress from anon/i);
      expect(sql).not.toMatch(/lesson_key/i);
      expect(sql).not.toMatch(/create policy "Public progress count readable"[\s\S]*on public\.progress/i);
    });
  });

  it('adminUserRollupsStayAdminOnly', () => {
    const schema = readText('../../supabase-schema.sql')
      .split('-- Admin user table with pre-aggregated user stats.')[1] || '';
    const migration = readText('../../supabase/migrations/202605110002_lock_admin_user_rollups.sql');

    [schema, migration].forEach((sql) => {
      expect(sql).toMatch(/create or replace view public\.admin_user_rollups\s+with\s*\(\s*security_invoker\s*=\s*true\s*\)/i);
      expect(sql).toMatch(/where public\.is_admin\(\)/i);
      expect(sql).toMatch(/grant select on public\.admin_user_rollups to authenticated/i);
    });
  });
});
