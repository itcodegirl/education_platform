// ═══════════════════════════════════════════════
// USERS TAB — Full roster with enable/disable
// admin actions, scoped to the current admin.
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabaseClient';

export function UsersTab({
  data,
  currentUserId,
  totalUsers,
  actionLoading,
  setActionLoading,
  onUserUpdated,
}) {
  return (
    <div className="admin-section">
      <h3 className="admin-section-title">👥 All Users ({totalUsers})</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Lessons Done</th>
              <th>XP</th>
              <th>Streak</th>
              <th>Badges</th>
              <th>Actions</th>
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
                        onClick={async () => {
                          if (!confirm(`${isDisabled ? 'Enable' : 'Disable'} ${u.display_name || 'this user'}?`)) return;
                          setActionLoading(u.id);
                          try {
                            await supabase
                              .from('profiles')
                              .update({ is_disabled: !isDisabled })
                              .eq('id', u.id);
                            onUserUpdated(u.id, { is_disabled: !isDisabled });
                          } catch (err) {
                            console.error('Failed to toggle user:', err);
                          } finally {
                            setActionLoading(null);
                          }
                        }}
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
