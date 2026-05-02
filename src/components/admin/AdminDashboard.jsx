// ===============================================
// ADMIN DASHBOARD - Orchestrator
//
// Composes five focused tab components + the useAdminData hook.
// Owns nothing beyond the active tab index and the computed stats
// derived from fetched data. Admin access check, data fetching,
// and optimistic updates all live in useAdminData.
//
// Protected by the is_admin flag in profiles - the real security
// boundary is the Postgres RLS policy + the admin-escalation
// trigger + set_user_admin() RPC documented in supabase-schema.sql.
// This UI only reflects what the database will allow.
//
// Split from a single 520-LOC component per the portfolio audit.
// ===============================================

import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useAuth, useCourseContent } from '../../providers';
import { useAdminData } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { COURSES } from '../../data';
import { lessonKeyBelongsToCourse, resolveStableLessonKey } from '../../utils/lessonKeys';
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
    const courseProgress = progress.filter((row) => lessonKeyBelongsToCourse(row.lesson_key, course));
    const userLessonSets = new Map();
    const lessonUsers = new Map();

    courseProgress.forEach((row) => {
      const stableLessonKey = resolveStableLessonKey(course, row.lesson_key);
      if (!stableLessonKey) return;

      if (!userLessonSets.has(row.user_id)) {
        userLessonSets.set(row.user_id, new Set());
      }
      userLessonSets.get(row.user_id).add(stableLessonKey);

      if (!lessonUsers.has(stableLessonKey)) {
        lessonUsers.set(stableLessonKey, new Set());
      }
      lessonUsers.get(stableLessonKey).add(row.user_id);
    });

    const uniqueUsers = userLessonSets.size;
    const completedUsers = Array.from(userLessonSets.values())
      .filter((lessonSet) => lessonSet.size >= totalLessons)
      .length;

    const lessonCounts = {};
    lessonUsers.forEach((usersForLesson, key) => {
      lessonCounts[key] = usersForLesson.size;
    });

    const totalCompletions = Array.from(userLessonSets.values())
      .reduce((sum, lessonSet) => sum + lessonSet.size, 0);

    return {
      ...course,
      totalLessons,
      uniqueUsers,
      completedUsers,
      totalCompletions,
      avgProgress:
        uniqueUsers > 0
          ? Math.round((totalCompletions / uniqueUsers / totalLessons) * 100)
          : 0,
      lessonCounts,
    };
  });
}

export function AdminDashboard({ onClose }) {
  const { user } = useAuth();
  const {
    isAdmin,
    checking,
    data,
    setData,
    dashboardMetrics,
    loading,
    loadError,
    usersCounts,
    usersPagination,
    analyticsMeta,
  } = useAdminData(user);
  const [tab, setTab] = useState('overview');
  useDocumentTitle('Admin');
  // Admin stats span every course, so load them all on mount.
  // Safe: if the courses are already loaded, this is a no-op.
  const { ensureAllLoaded, allCoursesLoaded } = useCourseContent();
  useEffect(() => { ensureAllLoaded(); }, [ensureAllLoaded]);

  // ARIA tab keyboard navigation — Left/Right arrow moves between
  // tabs, Home jumps to first, End jumps to last. Mirrors the WAI-ARIA
  // Authoring Practices tab pattern. Tab/Shift+Tab still work to
  // enter/leave the tablist normally because each tab is a <button>.
  const tabRefs = useRef({});
  const handleTabsKeyDown = useCallback((e) => {
    const currentIdx = TABS.findIndex((t) => t.id === tab);
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = TABS.length - 1;
    if (nextIdx === null) return;

    e.preventDefault();
    const nextTab = TABS[nextIdx];
    setTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  }, [tab]);

  // --- Derived stats --- memoized so tab switches don't recompute
  const stats = useMemo(() => {
    if (loading || !isAdmin) return null;
    return {
      totalUsers: usersCounts.total,
      newUsersWeek: usersCounts.newWeek,
      newUsersMonth: usersCounts.newMonth,
      totalCompletions: dashboardMetrics.totalCompletions || data.progress.length,
      activeUsers: dashboardMetrics.activeUsersWeek,
      totalQuizAttempts: dashboardMetrics.totalQuizAttempts || data.quizScores.length,
      totalBadges: dashboardMetrics.totalBadges,
      totalXP: dashboardMetrics.totalXP,
      courseStats: computeCourseStats(COURSES, data.progress),
      topUsers: dashboardMetrics.topUsers,
      funnel7d: dashboardMetrics.funnel7d,
      funnel30d: dashboardMetrics.funnel30d,
    };
  }, [dashboardMetrics, data, loading, isAdmin, usersCounts]);

  // --- Early-return states ---
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
            Retry Retry
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
            <span className="admin-logo" aria-hidden="true">*</span>
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

        <nav
          className="admin-tabs"
          role="tablist"
          aria-label="Admin sections"
          onKeyDown={handleTabsKeyDown}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[t.id] = el; }}
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
            {(analyticsMeta.progressIsSampled || analyticsMeta.quizIsSampled) && (
              <p className="admin-data-scope" role="note">
                Large dataset mode: course and activity analytics are computed from the latest
                {' '}{analyticsMeta.rowLimit.toLocaleString()} records per table for faster admin loads.
              </p>
            )}
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





