// ═══════════════════════════════════════════════
// ADMIN ACTIONS — Pure helpers for admin mutations.
// Kept separate from UsersTab.jsx so they can be
// unit-tested without pulling in the Supabase client
// (which fails at module-load time without env vars).
// ═══════════════════════════════════════════════

// Returns true when disabling `targetUserId` would leave zero
// active (non-disabled) admins in the system. The target itself is
// excluded from the remaining-admins count because we assume the
// disable action is about to complete successfully.
export function wouldLeaveZeroActiveAdmins(users, targetUserId) {
  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser?.is_admin) return false;
  const activeAdmins = users.filter(
    u => u.is_admin && !u.is_disabled && u.id !== targetUserId,
  );
  return activeAdmins.length === 0;
}
