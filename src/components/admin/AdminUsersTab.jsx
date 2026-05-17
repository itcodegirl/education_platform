import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function UsersPager({ usersPagination, usersTotal }) {
  const start = usersTotal === 0 ? 0 : (usersPagination.page - 1) * usersPagination.pageSize + 1;
  const end = Math.min(usersPagination.page * usersPagination.pageSize, usersTotal);

  return (
    <div className="admin-pager" role="navigation" aria-label="Users pagination">
      <div className="admin-pager-meta">
        Showing {start}-{end} of {usersTotal}
      </div>
      <div className="admin-pager-actions">
        <button
          type="button"
          className="admin-page-btn"
          aria-label="Go to previous users page"
          onClick={usersPagination.prevPage}
          disabled={!usersPagination.hasPrev}
        >
          &lt; Prev
        </button>
        <span className="admin-page-indicator">
          Page {usersPagination.page} / {usersPagination.totalPages}
        </span>
        <button
          type="button"
          className="admin-page-btn"
          aria-label="Go to next users page"
          onClick={usersPagination.nextPage}
          disabled={!usersPagination.hasNext}
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}

export function AdminUsersTab({ data, currentUserId, setData, usersPagination, usersTotal }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  const getUserLabel = (user) => user.display_name || 'this user';
  const isActionLoading = (userId, action) => actionLoading === `${userId}:${action}`;
  const isAnyUserActionLoading = (userId) => Boolean(actionLoading?.startsWith(`${userId}:`));

  const handleToggleDisabled = async (u) => {
    const isDisabled = !!u.is_disabled;
    if (!confirm(`${isDisabled ? 'Enable' : 'Disable'} ${getUserLabel(u)}?`)) {
      return;
    }
    setActionLoading(`${u.id}:status`);
    setActionError(null);
    try {
      const { error } = await supabase.rpc('set_user_disabled', {
        target_user_id: u.id,
        make_disabled: !isDisabled,
      });
      if (error) {
        throw error;
      }
      setData((prev) => ({
        ...prev,
        users: prev.users.map((usr) => (usr.id === u.id ? { ...usr, is_disabled: !isDisabled } : usr)),
      }));
    } catch (err) {
      setActionError(
        `Could not ${isDisabled ? 'enable' : 'disable'} ${
          getUserLabel(u)
        }. Please try again.`
      );
      if (import.meta.env.DEV) {
        console.error('Failed to toggle user:', err);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (u) => {
    const isAdmin = !!u.is_admin;
    const action = isAdmin ? 'Remove admin access from' : 'Grant admin access to';

    if (!confirm(`${action} ${getUserLabel(u)}?`)) {
      return;
    }

    setActionLoading(`${u.id}:admin`);
    setActionError(null);
    try {
      const { error } = await supabase.rpc('set_user_admin', {
        target_user_id: u.id,
        make_admin: !isAdmin,
      });
      if (error) {
        throw error;
      }
      setData((prev) => ({
        ...prev,
        users: prev.users.map((usr) => (usr.id === u.id ? { ...usr, is_admin: !isAdmin } : usr)),
      }));
    } catch (err) {
      setActionError(
        `Could not ${isAdmin ? 'remove admin access from' : 'grant admin access to'} ${
          getUserLabel(u)
        }. Please try again.`
      );
      if (import.meta.env.DEV) {
        console.error('Failed to toggle admin role:', err);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">👥 All Users ({usersTotal})</h3>
      {actionError && (
        <p className="admin-action-error" role="alert">
          {actionError}
        </p>
      )}
      <UsersPager usersPagination={usersPagination} usersTotal={usersTotal} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="sr-only">
            Admin user accounts with account status, progress totals, and moderation actions.
          </caption>
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
            {data.users.map((u) => {
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
                      {isDisabled ? '⚪ Disabled' : '✅ Active'}
                    </span>
                  </td>
                  <td className="admin-date">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>{u.lessons_done || 0}</td>
                  <td className="admin-xp">{(u.xp_total || 0).toLocaleString()}</td>
                  <td>{u.streak_days || 0} days</td>
                  <td>{u.badges_earned || 0}</td>
                  <td>
                    {isSelf ? (
                      <div className="admin-action-stack">
                        <span className="admin-action-disabled">You</span>
                        <span className="admin-action-disabled">Admin locked</span>
                      </div>
                    ) : (
                      <div className="admin-action-stack">
                        <button
                          type="button"
                          className={`admin-toggle-btn ${isDisabled ? 'enable' : 'disable'}`}
                          aria-label={`${isDisabled ? 'Enable' : 'Disable'} user ${getUserLabel(u)}`}
                          disabled={isAnyUserActionLoading(u.id)}
                          onClick={() => handleToggleDisabled(u)}
                        >
                          {isActionLoading(u.id, 'status')
                            ? '...'
                            : isDisabled
                              ? 'Enable'
                              : 'Disable'}
                        </button>
                        <button
                          type="button"
                          className={`admin-role-btn ${u.is_admin ? 'revoke' : 'grant'}`}
                          aria-label={`${u.is_admin ? 'Remove admin access from' : 'Grant admin access to'} ${getUserLabel(u)}`}
                          disabled={isAnyUserActionLoading(u.id)}
                          onClick={() => handleToggleAdmin(u)}
                        >
                          {isActionLoading(u.id, 'admin')
                            ? '...'
                            : u.is_admin
                              ? 'Remove admin'
                              : 'Grant admin'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <UsersPager usersPagination={usersPagination} usersTotal={usersTotal} />
    </div>
  );
}
