// ═══════════════════════════════════════════════
// USERS TAB — Full roster with enable/disable
// admin actions, scoped to the current admin.
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabaseClient';
import { wouldLeaveZeroActiveAdmins } from '../adminActions';
import { logAdminAction, AUDIT_ACTIONS } from '../../../services/auditLogService';

async function toggleUserDisabled(
  user,
  { onUserUpdated, setActionLoading, currentAdminId, currentAdminName },
) {
  const isDisabled = !!user.is_disabled;
  setActionLoading(user.id);
  try {
    // .select() forces the API to return the updated row(s) so we can
    // detect silent failures (RLS rejecting the write, id not found,
    // etc.) that Supabase would otherwise swallow.
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ is_disabled: !isDisabled })
      .eq('id', user.id)
      .select('id, is_disabled');

    if (error) {
      console.error('Failed to toggle user:', error);
      // eslint-disable-next-line no-alert
      alert(`Could not update ${user.display_name || 'this user'}: ${error.message}`);
      return;
    }
    if (!updated || updated.length === 0) {
      console.error('Toggle user: no rows updated', user.id);
      // eslint-disable-next-line no-alert
      alert(
        `Could not update ${user.display_name || 'this user'}. `
        + 'The row was not modified — you may not have permission, or the user no longer exists.',
      );
      return;
    }

    onUserUpdated(user.id, { is_disabled: updated[0].is_disabled });

    // Fire-and-forget audit log write via the centralised service.
    // Logging failures are logged to console but never block the UI.
    logAdminAction({
      adminId: currentAdminId,
      adminName: currentAdminName,
      action: updated[0].is_disabled ? AUDIT_ACTIONS.USER_DISABLED : AUDIT_ACTIONS.USER_ENABLED,
      targetUserId: user.id,
      targetName: user.display_name || null,
    });
  } finally {
    setActionLoading(null);
  }
}

export function UsersTab({
  data,
  currentUserId,
  currentAdminName,
  totalUsers,
  actionLoading,
  setActionLoading,
  onUserUpdated,
}) {
  const handleToggle = async (u) => {
    const isDisabled = !!u.is_disabled;
    // Disabling an active admin is only safe if at least one other active
    // admin remains. Enabling is always fine.
    if (!isDisabled && wouldLeaveZeroActiveAdmins(data.users, u.id)) {
      // eslint-disable-next-line no-alert
      alert(
        'Refusing to disable the last active admin. '
        + 'Promote another account to admin first.',
      );
      return;
    }
    // eslint-disable-next-line no-alert
    if (!confirm(`${isDisabled ? 'Enable' : 'Disable'} ${u.display_name || 'this user'}?`)) {
      return;
    }
    await toggleUserDisabled(u, {
      onUserUpdated,
      setActionLoading,
      currentAdminId: currentUserId,
      currentAdminName,
    });
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">👥 All Users ({totalUsers})</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Joined</th>
              <th scope="col">Lessons Done</th>
              <th scope="col">XP</th>
              <th scope="col">Streak</th>
              <th scope="col">Badges</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map(u => {
              const userProgress = data.progress.filter(p => p.user_id === u.id).length;
              const userXP = data.xp.find(x => x.user_id === u.id)?.total || 0;
              const userStreak = data.streaks.find(s => s.user_id === u.id)?.days || 0;
              const userBadges = data.badges.filter(b => b.user_id === u.id).length;
              const isDisabled = !!u.is_disabled;
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className={isDisabled ? 'admin-row-disabled' : ''}>
                  <td className="admin-user-name">
                    {u.display_name || 'Anonymous'}
                    {u.is_admin && <span className="admin-badge">Admin</span>}
                  </td>
                  <td>
                    <span className={`admin-status ${isDisabled ? 'disabled' : 'active'}`}>
                      {isDisabled ? '🚫 Disabled' : '✅ Active'}
                    </span>
                  </td>
                  <td className="admin-date">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>{userProgress}</td>
                  <td className="admin-xp">{userXP.toLocaleString()}</td>
                  <td>{userStreak} days</td>
                  <td>{userBadges}</td>
                  <td>
                    {isSelf ? (
                      <span className="admin-action-disabled">You</span>
                    ) : (
                      <button
                        className={`admin-toggle-btn ${isDisabled ? 'enable' : 'disable'}`}
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggle(u)}
                        aria-label={`${isDisabled ? 'Enable' : 'Disable'} ${u.display_name || 'user'}`}
                      >
                        {actionLoading === u.id
                          ? '...'
                          : isDisabled ? '✅ Enable' : '🚫 Disable'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

