// ═══════════════════════════════════════════════
// ADMIN DASHBOARD — User stats, progress, analytics
// Protected by is_admin flag in profiles table
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../providers';
import { COURSES } from '../../data';

export function AdminDashboard({ onClose }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(null);
  const [data, setData] = useState({
    users: [],
    progress: [],
    quizScores: [],
    xp: [],
    streaks: [],
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!user) { setChecking(false); return; }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        setIsAdmin(!!profile?.is_admin);
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }
    checkAdmin();
  }, [user]);

  // Fetch all data once admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;
    async function fetchAll() {
      setLoading(true);
      setLoadError(null);
      try {
        const [users, progress, quizScores, xp, streaks, badges] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('progress').select('*'),
          supabase.from('quiz_scores').select('*'),
          supabase.from('xp').select('*'),
          supabase.from('streaks').select('*'),
          supabase.from('badges').select('*'),
        ]);
        setData({
          users: users.data || [],
          progress: progress.data || [],
          quizScores: quizScores.data || [],
          xp: xp.data || [],
          streaks: streaks.data || [],
          badges: badges.data || [],
        });
      } catch (err) {
        setLoadError('Failed to load admin data. Check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [isAdmin]);

  // ─── Access denied states ──────────────────
  if (checking) return (
    <div className="admin-wrap">
      <div className="admin-loading">Checking access...</div>
    </div>
  );

  if (!isAdmin) return (
    <div className="admin-wrap">
      <div className="admin-denied">
        <span className="admin-denied-icon">🔒</span>
        <h2>Access Denied</h2>
        <p>You don't have admin privileges.</p>
        <button className="admin-back-btn" onClick={onClose}>← Back to Platform</button>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="admin-wrap">
      <div className="admin-denied">
        <span className="admin-denied-icon">📡</span>
        <h2>Connection Error</h2>
        <p>{loadError}</p>
        <button className="admin-back-btn" onClick={() => window.location.reload()}>↺ Retry</button>
      </div>
    </div>
  );

  // ─── Computed stats ────────────────────────
  const totalUsers = data.users.length;
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const newUsersWeek = data.users.filter(u => new Date(u.created_at) > weekAgo).length;
  const newUsersMonth = data.users.filter(u => new Date(u.created_at) > monthAgo).length;

  const totalCompletions = data.progress.length;
  const activeUsers = new Set(data.progress.filter(p => new Date(p.completed_at) > weekAgo).map(p => p.user_id)).size;

  // Course completion stats
  const courseStats = COURSES.map(course => {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const courseProgress = data.progress.filter(p => p.lesson_key.startsWith(course.label));
    const uniqueUsers = new Set(courseProgress.map(p => p.user_id)).size;

    // Users who completed ALL lessons in this course
    const userLessonCounts = {};
    courseProgress.forEach(p => {
      userLessonCounts[p.user_id] = (userLessonCounts[p.user_id] || 0) + 1;
    });
    const completedUsers = Object.values(userLessonCounts).filter(c => c >= totalLessons).length;

    // Most completed lessons
    const lessonCounts = {};
    courseProgress.forEach(p => {
      lessonCounts[p.lesson_key] = (lessonCounts[p.lesson_key] || 0) + 1;
    });

    return {
      ...course,
      totalLessons,
      uniqueUsers,
      completedUsers,
      totalCompletions: courseProgress.length,
      avgProgress: uniqueUsers > 0 ? Math.round((courseProgress.length / uniqueUsers / totalLessons) * 100) : 0,
      lessonCounts,
    };
  });

  // Top users by XP
  const topUsers = data.xp
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 10)
    .map(x => {
      const profile = data.users.find(u => u.id === x.user_id);
      return { ...x, name: profile?.display_name || 'Anonymous' };
    });

  // Quiz stats
  const quizStats = {};
  data.quizScores.forEach(qs => {
    if (!quizStats[qs.quiz_key]) quizStats[qs.quiz_key] = { attempts: 0, scores: [] };
    quizStats[qs.quiz_key].attempts++;
    const [got, total] = (qs.score || '0/0').split('/').map(Number);
    if (total > 0) quizStats[qs.quiz_key].scores.push(got / total);
  });

  // Lesson drop-off analysis
  const lessonCompletionRanking = {};
  data.progress.forEach(p => {
    lessonCompletionRanking[p.lesson_key] = (lessonCompletionRanking[p.lesson_key] || 0) + 1;
  });

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo">⚡</span>
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">CodeHerWay Platform Analytics</p>
            </div>
          </div>
          <button className="admin-back-btn" onClick={onClose}>← Back to Platform</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'users', label: '👥 Users' },
            { id: 'courses', label: '📚 Courses' },
            { id: 'quizzes', label: '📝 Quizzes' },
          ].map(t => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">Loading data...</div>
        ) : (
          <div className="admin-content">

            {/* ─── OVERVIEW TAB ─── */}
            {tab === 'overview' && (
              <>
                <div className="admin-grid">
                  <StatCard label="Total Users" value={totalUsers} icon="👥" />
                  <StatCard label="New This Week" value={newUsersWeek} icon="📈" accent="var(--cyan)" />
                  <StatCard label="New This Month" value={newUsersMonth} icon="📅" accent="var(--amber)" />
                  <StatCard label="Active This Week" value={activeUsers} icon="⚡" accent="var(--pink)" />
                  <StatCard label="Lessons Completed" value={totalCompletions} icon="✅" accent="var(--cyan)" />
                  <StatCard label="Quiz Attempts" value={data.quizScores.length} icon="📝" accent="var(--purple)" />
                  <StatCard label="Badges Earned" value={data.badges.length} icon="🏅" accent="var(--amber)" />
                  <StatCard label="Total XP Awarded" value={data.xp.reduce((s, x) => s + (x.total || 0), 0).toLocaleString()} icon="⭐" accent="var(--pink)" />
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
            )}

            {/* ─── USERS TAB ─── */}
            {tab === 'users' && (
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
                        const isSelf = u.id === user.id;
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
                                      // Update local state
                                      setData(prev => ({
                                        ...prev,
                                        users: prev.users.map(usr =>
                                          usr.id === u.id ? { ...usr, is_disabled: !isDisabled } : usr
                                        )
                                      }));
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
            )}

            {/* ─── COURSES TAB ─── */}
            {tab === 'courses' && (
              <>
                {/* Completion Funnel */}
                <div className="admin-section">
                  <h3 className="admin-section-title">📊 Course Completion Funnel</h3>
                  <div className="admin-course-grid">
                    {courseStats.map(c => {
                      const stages = [
                        { label: 'Started', count: c.uniqueUsers, pct: 100 },
                        { label: '25%+', count: Object.values((() => { const m = {}; data.progress.filter(p => p.lesson_key.startsWith(c.label)).forEach(p => { m[p.user_id] = (m[p.user_id] || 0) + 1; }); return m; })()).filter(n => n >= Math.ceil(c.totalLessons * 0.25)).length, pct: null },
                        { label: '50%+', count: Object.values((() => { const m = {}; data.progress.filter(p => p.lesson_key.startsWith(c.label)).forEach(p => { m[p.user_id] = (m[p.user_id] || 0) + 1; }); return m; })()).filter(n => n >= Math.ceil(c.totalLessons * 0.5)).length, pct: null },
                        { label: '75%+', count: Object.values((() => { const m = {}; data.progress.filter(p => p.lesson_key.startsWith(c.label)).forEach(p => { m[p.user_id] = (m[p.user_id] || 0) + 1; }); return m; })()).filter(n => n >= Math.ceil(c.totalLessons * 0.75)).length, pct: null },
                        { label: 'Completed', count: c.completedUsers, pct: null },
                      ];
                      stages.forEach(s => { if (s.pct === null) s.pct = c.uniqueUsers > 0 ? Math.round((s.count / c.uniqueUsers) * 100) : 0; });
                      return (
                        <div key={c.id} className="admin-course-card">
                          <div className="admin-course-header">
                            <span>{c.icon} {c.label}</span>
                            <span className="admin-course-accent" style={{ color: c.accent }}>{c.uniqueUsers} learners</span>
                          </div>
                          <div className="admin-course-stats">
                            {stages.map((s, i) => (
                              <div key={i}>
                                <div className="admin-stat-row">
                                  <span>{s.label}</span>
                                  <span className="admin-stat-val">{s.count} ({s.pct}%)</span>
                                </div>
                                <div className="admin-progress-bar">
                                  <div className="admin-progress-fill" style={{ width: `${s.pct}%`, background: c.accent }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {courseStats.map(c => (
                  <div key={c.id} className="admin-section">
                    <h3 className="admin-section-title" style={{ color: c.accent }}>
                      {c.icon} {c.label} — Lesson Completions
                    </h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Lesson</th><th>Completions</th><th>Bar</th></tr>
                        </thead>
                        <tbody>
                          {c.modules.flatMap(m =>
                            m.lessons.map(l => {
                              const key = `${c.label}|${m.title}|${l.title}`;
                              const count = c.lessonCounts[key] || 0;
                              const maxCount = Math.max(...Object.values(c.lessonCounts), 1);
                              return (
                                <tr key={key}>
                                  <td className="admin-lesson-name">
                                    <span className="admin-lesson-mod">{m.emoji}</span>
                                    {l.title}
                                  </td>
                                  <td className="admin-lesson-count">{count}</td>
                                  <td className="admin-lesson-bar-cell">
                                    <div className="admin-lesson-bar">
                                      <div
                                        className="admin-lesson-bar-fill"
                                        style={{ width: `${(count / maxCount) * 100}%`, background: c.accent }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ─── QUIZZES TAB ─── */}
            {tab === 'quizzes' && (
              <div className="admin-section">
                <h3 className="admin-section-title">📝 Quiz Performance</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Quiz</th><th>Attempts</th><th>Avg Score</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(quizStats)
                        .sort((a, b) => b[1].attempts - a[1].attempts)
                        .map(([key, stats]) => {
                          const avg = stats.scores.length > 0
                            ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length * 100)
                            : 0;
                          return (
                            <tr key={key}>
                              <td>{key}</td>
                              <td>{stats.attempts}</td>
                              <td>
                                <span className={`admin-score ${avg >= 80 ? 'good' : avg >= 50 ? 'ok' : 'low'}`}>
                                  {avg}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {Object.keys(quizStats).length === 0 && (
                        <tr><td colSpan={3} className="admin-empty">No quiz data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-info">
        <div className="admin-stat-value" style={accent ? { color: accent } : {}}>{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
