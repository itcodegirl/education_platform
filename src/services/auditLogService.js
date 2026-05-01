// ═══════════════════════════════════════════════
// AUDIT LOG SERVICE — Centralised writer for admin
// actions. Backed by public.admin_audit_log in
// Supabase (see supabase-schema.sql).
//
// Every admin-initiated mutation in the app should
// route its logging through here so the schema stays
// consistent and failures are handled the same way
// everywhere. Logging is always fire-and-forget:
// a failed insert logs to console but never blocks
// the UI.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';

// Action constants — keep in sync with AuditLogTab's
// label map so every action gets a human-readable row
// in the viewer.
export const AUDIT_ACTIONS = {
  USER_DISABLED:     'user_disabled',
  USER_ENABLED:      'user_enabled',
  LESSON_DOWNLOADED: 'lesson_downloaded',
  LESSON_COPIED:     'lesson_copied',
};

/**
 * Insert an admin audit log row.
 *
 * @param {object}  entry
 * @param {string}  entry.adminId          - auth.uid() of the admin performing the action
 * @param {string?} entry.adminName        - captured display name at the time of action
 * @param {string}  entry.action           - AUDIT_ACTIONS value
 * @param {string?} [entry.targetUserId]   - affected user id, if any
 * @param {string?} [entry.targetName]     - affected user's display name
 * @param {object?} [entry.details]        - action-specific metadata (JSONB)
 * @returns {Promise<{ error: Error|null }>} always resolves; caller never needs try/catch
 */
export async function logAdminAction({
  adminId,
  adminName,
  action,
  targetUserId = null,
  targetName = null,
  details = null,
}) {
  if (!adminId) {
    const err = new Error('logAdminAction: adminId is required');
    console.error(err);
    return { error: err };
  }
  if (!action) {
    const err = new Error('logAdminAction: action is required');
    console.error(err);
    return { error: err };
  }

  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    admin_display_name: adminName || null,
    target_user_id: targetUserId || null,
    target_display_name: targetName || null,
    action,
    details,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
  return { error: error || null };
}
