// ═══════════════════════════════════════════════
// USERS TAB HELPERS — Pins the "don't disable the
// last active admin" guard so a future refactor
// can't accidentally let the platform lock itself
// out of its own admin dashboard.
// ═══════════════════════════════════════════════

import { describe, test, expect } from 'vitest';
import { wouldLeaveZeroActiveAdmins } from '../../src/components/admin/adminActions.js';

const alice = { id: 'a', display_name: 'Alice', is_admin: true,  is_disabled: false };
const bob   = { id: 'b', display_name: 'Bob',   is_admin: true,  is_disabled: false };
const carol = { id: 'c', display_name: 'Carol', is_admin: false, is_disabled: false };
const dave  = { id: 'd', display_name: 'Dave',  is_admin: true,  is_disabled: true  };

describe('wouldLeaveZeroActiveAdmins', () => {
  test('returns false when disabling a non-admin user', () => {
    const users = [alice, bob, carol];
    expect(wouldLeaveZeroActiveAdmins(users, carol.id)).toBe(false);
  });

  test('returns false when another active admin remains', () => {
    const users = [alice, bob, carol];
    expect(wouldLeaveZeroActiveAdmins(users, alice.id)).toBe(false);
  });

  test('returns true when disabling the last active admin', () => {
    const users = [alice, carol, dave]; // dave is an admin but disabled
    expect(wouldLeaveZeroActiveAdmins(users, alice.id)).toBe(true);
  });

  test('returns true when disabling the only admin', () => {
    const users = [alice, carol];
    expect(wouldLeaveZeroActiveAdmins(users, alice.id)).toBe(true);
  });

  test('returns false for an unknown user id', () => {
    const users = [alice, bob];
    expect(wouldLeaveZeroActiveAdmins(users, 'ghost')).toBe(false);
  });

  test('ignores the user being disabled when counting other active admins', () => {
    // Only Alice and Bob are active admins. Disabling Bob leaves Alice,
    // so the guard should allow it.
    const users = [alice, bob, dave];
    expect(wouldLeaveZeroActiveAdmins(users, bob.id)).toBe(false);
  });
});
