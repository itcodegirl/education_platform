import { supabase } from '../lib/supabaseClient';

export const AUDIT_ACTIONS = {
  USER_DISABLED: 'disable_user',
  USER_ENABLED: 'enable_user',
  ADMIN_GRANTED: 'grant_admin',
  ADMIN_REVOKED: 'revoke_admin',
  LESSON_DOWNLOADED: 'lesson_downloaded',
  LESSON_COPIED: 'lesson_copied',
};

/**
 * Insert an admin audit log row without blocking the caller's UI flow.
 *
 * The table schema is intentionally narrow: actor id, target id, action,
 * optional JSON details, and timestamp. Display names are best-effort context
 * stored in details when provided.
 */
export async function logAdminAction({
  adminId,
  adminName,
  action,
  targetUserId,
  targetName = null,
  details = null,
}) {
  if (!adminId) {
    const err = new Error('logAdminAction: adminId is required');
    console.error(err);
    return { error: err };
  }
  if (!targetUserId) {
    const err = new Error('logAdminAction: targetUserId is required');
    console.error(err);
    return { error: err };
  }
  if (!action) {
    const err = new Error('logAdminAction: action is required');
    console.error(err);
    return { error: err };
  }

  const enrichedDetails = {
    ...(details && typeof details === 'object' && !Array.isArray(details) ? details : {}),
    ...(adminName ? { actorName: adminName } : {}),
    ...(targetName ? { targetName } : {}),
  };

  const { error } = await supabase.from('admin_audit_log').insert({
    actor_id: adminId,
    target_id: targetUserId,
    action,
    details: Object.keys(enrichedDetails).length > 0 ? enrichedDetails : null,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
  return { error: error || null };
}
