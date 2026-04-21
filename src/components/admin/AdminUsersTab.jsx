// ═══════════════════════════════════════════════
// ADMIN USERS TAB — Table of every user with inline
// enable/disable action. Optimistically updates the
// parent's data state so the UI reflects the change
// before Supabase confirms.
//
// The "can't disable yourself" guard lives here because
// it's a UX concern (showing "You" instead of a button),
// but the real security guard is a Postgres RLS policy
// on profiles.is_disabled.
// ═══════════════════════════════════════════════

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
          onClick={usersPagination.prevPage}
          disabled={!usersPagination.hasPrev}
        >
          ← Prev
        </button>
        <span className="admin-page-indicator">
          Page {usersPagination.page} / {usersPagination.totalPages}
        </span>
        <button
          type="button"
          className="admin-page-btn"
          onClick={usersPagination.nextPage}
          disabled={!usersPagination.hasNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export function AdminUsersTab({ data, currentUserId, setData, usersPagination, usersTotal }) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleToggleDisabled = async (u) => {
    const isDisabled = !!u.is_disabled;
    if (!confirm(`${isDisabled ? 'Enable' : 'Disable'} ${u.display_name || 'this user'}?`)) {
      return;
    }
    setActionLoading(u.id);
    try {
      await supabase
        .from('profiles')
        .update({ is_disabled: !isDisabled })
        .eq('id', u.id);
      setData((prev) => ({
        ...prev,
        users: prev.users.map((usr) =>
          usr.id === u.id ? { ...usr, is_disabled: !isDisabled } : usr,
        ),
      }));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to toggle user:', err);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">👥 All Users ({usersTotal})</h3>
      <UsersPager usersPagination={usersPagination} usersTotal={usersTotal} />
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
            {data.users.map((u) => {
              const userProgress = data.progress.filter((p) => p.user_id === u.id).length;
              const userXP = data.xp.find((x) => x.user_id === u.id)?.total || 0;
              const userStreak = data.streaks.find((s) => s.user_id === u.id)?.days || 0;
              const userBadges = data.badges.filter((b) => b.user_id === u.id).length;
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
                        type="button"
                        className={`admin-toggle-btn ${isDisabled ? 'enable' : 'disable'}`}
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleDisabled(u)}
                      >
                        {actionLoading === u.id
                          ? '...'
                          : isDisabled
                            ? '✅ Enable'
                            : '🚫 Disable'}
                      </button>
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
