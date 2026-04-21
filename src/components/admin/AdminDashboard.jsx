// ═══════════════════════════════════════════════
// ADMIN DASHBOARD — Orchestrator
//
// Composes five focused tab components + the useAdminData hook.
// Owns nothing beyond the active tab index and the computed stats
// derived from fetched data. Admin access check, data fetching,
// and optimistic updates all live in useAdminData.
//
// Protected by the is_admin flag in profiles — the real security
// boundary is the Postgres RLS policy + the admin-escalation
// trigger + set_user_admin() RPC documented in supabase-schema.sql.
// This UI only reflects what the database will allow.
//
// Split from a single 520-LOC component per the portfolio audit.
// ═══════════════════════════════════════════════

import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useAuth, useCourseContent } from '../../providers';
import { useAdminData } from '../../hooks/useAdminData';
import { COURSES } from '../../data';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminCoursesTab } from './AdminCoursesTab';
import { AdminQuizzesTab } from './AdminQuizzesTab';

const LessonBuilder = lazy(() =>
  import('./LessonBuilder').then((m) => ({ default: m.LessonBuilder })),
);

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'users',    label: '👥 Users'    },
  { id: 'courses',  label: '📚 Courses'  },
  { id: 'quizzes',  label: '📝 Quizzes'  },
  { id: 'builder',  label: '🛠️ Lesson Builder' },
];

function computeCourseStats(courses, progress) {
  return courses.map((course) => {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const courseProgress = progress.filter((p) => p.lesson_key.startsWith(course.label));
    const uniqueUsers = new Set(courseProgress.map((p) => p.user_id)).size;

    const userLessonCounts = {};
    courseProgress.forEach((p) => {
      userLessonCounts[p.user_id] = (userLessonCounts[p.user_id] || 0) + 1;
    });
    const completedUsers = Object.values(userLessonCounts).filter((c) => c >= totalLessons).length;

    const lessonCounts = {};
    courseProgress.forEach((p) => {
      lessonCounts[p.lesson_key] = (lessonCounts[p.lesson_key] || 0) + 1;
    });

    return {
      ...course,
      totalLessons,
      uniqueUsers,
      completedUsers,
      totalCompletions: courseProgress.length,
      avgProgress:
        uniqueUsers > 0
          ? Math.round((courseProgress.length / uniqueUsers / totalLessons) * 100)
          : 0,
      lessonCounts,
    };
  });
}

function computeTopUsers(xp, users) {
  return [...xp]
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 10)
    .map((x) => {
      const profile = users.find((u) => u.id === x.user_id);
      return { ...x, name: profile?.display_name || 'Anonymous' };
    });
}

export function AdminDashboard({ onClose }) {
  const { user } = useAuth();
  const {
    isAdmin,
    checking,
    data,
    setData,
    loading,
    loadError,
    usersCounts,
    usersPagination,
  } = useAdminData(user);
  const [tab, setTab] = useState('overview');
  // Admin stats span every course, so load them all on mount.
  // Safe: if the courses are already loaded, this is a no-op.
  const { ensureAllLoaded, allCoursesLoaded } = useCourseContent();
  useEffect(() => { ensureAllLoaded(); }, [ensureAllLoaded]);

  // ─── Derived stats ─── memoized so tab switches don't recompute
  const stats = useMemo(() => {
    if (loading || !isAdmin) return null;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    return {
      totalUsers: usersCounts.total,
      newUsersWeek: usersCounts.newWeek,
      newUsersMonth: usersCounts.newMonth,
      totalCompletions: data.progress.length,
      activeUsers: new Set(
        data.progress
          .filter((p) => new Date(p.completed_at) > weekAgo)
          .map((p) => p.user_id),
      ).size,
      totalQuizAttempts: data.quizScores.length,
      totalBadges: data.badges.length,
      totalXP: data.xp.reduce((s, x) => s + (x.total || 0), 0),
      courseStats: computeCourseStats(COURSES, data.progress),
      topUsers: computeTopUsers(data.xp, data.users),
    };
  }, [data, loading, isAdmin, usersCounts]);

  // ─── Early-return states ───
  if (checking) {
    return (
      <div className="admin-wrap">
        <div className="admin-loading" role="status" aria-live="polite">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-wrap">
        <div className="admin-denied" role="status" aria-live="polite">
          <span className="admin-denied-icon" aria-hidden="true">🔒</span>
          <h2>Access Denied</h2>
          <p>You don&apos;t have admin privileges.</p>
          <button
            type="button"
            className="admin-back-btn"
            onClick={onClose}
            aria-label="Return to the main platform"
          >
            ← Return to Platform
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-wrap">
        <div className="admin-denied" role="alert" aria-live="assertive">
          <span className="admin-denied-icon" aria-hidden="true">📡</span>
          <h2>Connection Error</h2>
          <p>{loadError}</p>
          <button
            type="button"
            className="admin-back-btn"
            onClick={() => window.location.reload()}
            aria-label="Reload the admin dashboard"
          >
            ↺ Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo" aria-hidden="true">⚡</span>
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">CodeHerWay Platform Analytics</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-back-btn"
            onClick={onClose}
            aria-label="Return to the main platform"
          >
            ← Return to Platform
          </button>
        </header>

        <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`admin-tab-panel-${t.id}`}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {loading || !stats || !allCoursesLoaded ? (
          <div className="admin-loading" role="status" aria-live="polite">
            Loading dashboard data...
          </div>
        ) : (
          <div className="admin-content">
            {tab === 'overview' && (
              <div id="admin-tab-panel-overview" role="tabpanel">
                <AdminOverviewTab {...stats} />
              </div>
            )}
            {tab === 'users' && (
              <div id="admin-tab-panel-users" role="tabpanel">
                <AdminUsersTab
                  data={data}
                  currentUserId={user.id}
                  setData={setData}
                  usersPagination={usersPagination}
                  usersTotal={usersCounts.total}
                />
              </div>
            )}
            {tab === 'courses' && (
              <div id="admin-tab-panel-courses" role="tabpanel">
                <AdminCoursesTab courseStats={stats.courseStats} progress={data.progress} />
              </div>
            )}
            {tab === 'quizzes' && (
              <div id="admin-tab-panel-quizzes" role="tabpanel">
                <AdminQuizzesTab quizScores={data.quizScores} />
              </div>
            )}
            {tab === 'builder' && (
              <div id="admin-tab-panel-builder" role="tabpanel">
                <Suspense
                  fallback={
                    <div className="admin-loading" role="status" aria-live="polite">
                      Loading lesson builder...
                    </div>
                  }
                >
                  <LessonBuilder />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

