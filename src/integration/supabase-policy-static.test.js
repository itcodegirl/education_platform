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
});
