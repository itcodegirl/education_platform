// ═══════════════════════════════════════════════
// ADMIN OVERVIEW TAB — 8 stat cards + course progress +
// top learners leaderboard. Presentational only — the
// parent dashboard passes pre-computed stats down.
// ═══════════════════════════════════════════════

import { AdminStatCard } from './AdminStatCard';

const FUNNEL_ROWS = [
  { id: 'onboardingOpened', label: 'Onboarding opened' },
  { id: 'onboardingAdvanced', label: 'Onboarding advanced' },
  { id: 'onboardingClosed', label: 'Onboarding closed' },
  { id: 'lessonViewed', label: 'Lessons viewed' },
  { id: 'lessonCompleted', label: 'Lessons completed' },
  { id: 'lessonNextClicked', label: 'Next lesson clicks' },
];

export function AdminOverviewTab({
  totalUsers,
  newUsersWeek,
  newUsersMonth,
  activeUsers,
  totalCompletions,
  totalQuizAttempts,
  totalBadges,
  totalXP,
  courseStats,
  topUsers,
  funnel7d,
  funnel30d,
}) {
  return (
    <>
      <div className="admin-grid">
        <AdminStatCard label="Total Users" value={totalUsers} icon="👥" />
        <AdminStatCard label="New This Week" value={newUsersWeek} icon="📈" accent="var(--cyan)" />
        <AdminStatCard label="New This Month" value={newUsersMonth} icon="📅" accent="var(--amber)" />
        <AdminStatCard label="Active This Week" value={activeUsers} icon="⚡" accent="var(--pink)" />
        <AdminStatCard label="Lessons Completed" value={totalCompletions} icon="✅" accent="var(--cyan)" />
        <AdminStatCard label="Quiz Attempts" value={totalQuizAttempts} icon="📝" accent="var(--purple)" />
        <AdminStatCard label="Badges Earned" value={totalBadges} icon="🏅" accent="var(--amber)" />
        <AdminStatCard label="Total XP Awarded" value={totalXP.toLocaleString()} icon="⭐" accent="var(--pink)" />
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">📊 Course Progress</h3>
        <div className="admin-course-grid">
          {courseStats.map((c) => (
            <div key={c.id} className="admin-course-card">
              <div className="admin-course-header">
                <span>{c.icon} {c.label}</span>
                <span className="admin-course-accent" style={{ color: c.accent }}>
                  {c.totalLessons} lessons
                </span>
              </div>
              <div className="admin-course-stats">
                <div className="admin-stat-row">
                  <span>Students enrolled</span>
                  <span className="admin-stat-val">{c.uniqueUsers}</span>
                </div>
                <div className="admin-stat-row">
                  <span>Completed course</span>
                  <span className="admin-stat-val">{c.completedUsers}</span>
                </div>
                <div className="admin-stat-row">
                  <span>Avg progress</span>
                  <span className="admin-stat-val">{c.avgProgress}%</span>
                </div>
                <div className="admin-progress-bar">
                  <div
                    className="admin-progress-fill"
                    style={{ width: `${c.avgProgress}%`, background: c.accent }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">🔎 Product Funnel (7d vs 30d)</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Last 7 days</th>
                <th>Last 30 days</th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className="admin-stat-val">{(funnel7d?.[row.id] || 0).toLocaleString()}</td>
                  <td className="admin-stat-val">{(funnel30d?.[row.id] || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">🏆 Top Learners by XP</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.user_id}>
                  <td className="admin-rank">{i + 1}</td>
                  <td>{u.name}</td>
                  <td className="admin-xp">{(u.total || 0).toLocaleString()} XP</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-empty">No data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
