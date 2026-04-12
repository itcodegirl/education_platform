// ═══════════════════════════════════════════════
// OVERVIEW TAB — High-level metrics, per-course
// progress, and top learners leaderboard.
// ═══════════════════════════════════════════════

import { StatCard } from '../StatCard';

export function OverviewTab({ data, stats, courseStats, topUsers }) {
  const { totalUsers, newUsersWeek, newUsersMonth, activeUsers, totalCompletions } = stats;

  return (
    <>
      <div className="admin-grid">
        <StatCard label="Total Users" value={totalUsers} icon="👥" />
        <StatCard label="New This Week" value={newUsersWeek} icon="📈" accent="var(--cyan)" />
        <StatCard label="New This Month" value={newUsersMonth} icon="📅" accent="var(--amber)" />
        <StatCard label="Active This Week" value={activeUsers} icon="⚡" accent="var(--pink)" />
        <StatCard label="Lessons Completed" value={totalCompletions} icon="✅" accent="var(--cyan)" />
        <StatCard label="Quiz Attempts" value={data.quizScores.length} icon="📝" accent="var(--purple)" />
        <StatCard label="Badges Earned" value={data.badges.length} icon="🏅" accent="var(--amber)" />
        <StatCard
          label="Total XP Awarded"
          value={data.xp.reduce((s, x) => s + (x.total || 0), 0).toLocaleString()}
          icon="⭐"
          accent="var(--pink)"
        />
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">📊 Course Progress</h3>
        <div className="admin-course-grid">
          {courseStats.map(c => (
            <div key={c.id} className="admin-course-card">
              <div className="admin-course-header">
                <span>{c.icon} {c.label}</span>
                <span className="admin-course-accent" style={{ color: c.accent }}>{c.totalLessons} lessons</span>
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
                  <div className="admin-progress-fill" style={{ width: `${c.avgProgress}%`, background: c.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">🏆 Top Learners by XP</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Student</th><th>XP</th></tr>
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
                <tr><td colSpan={3} className="admin-empty">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
