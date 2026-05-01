import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const USERS_PAGE_SIZE = 25;
const ADMIN_ANALYTICS_LIMIT = 3000;

const INITIAL_DATA = {
  users: [],
  progress: [],
  quizScores: [],
};

const INITIAL_DASHBOARD_METRICS = {
  totalUsers: 0,
  newUsersWeek: 0,
  newUsersMonth: 0,
  activeUsersWeek: 0,
  totalCompletions: 0,
  totalQuizAttempts: 0,
  totalBadges: 0,
  totalXP: 0,
  topUsers: [],
  funnel7d: {},
  funnel30d: {},
};

function toInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function toTopUsers(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      user_id: typeof row.user_id === 'string' ? row.user_id : '',
      name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Anonymous',
      total: toInt(row.total),
    }))
    .filter((row) => row.user_id)
    .slice(0, 10);
}

function toFunnel(value) {
  if (!value || typeof value !== 'object') return {};
  return {
    onboardingOpened: toInt(value.onboardingOpened),
    onboardingAdvanced: toInt(value.onboardingAdvanced),
    onboardingClosed: toInt(value.onboardingClosed),
    lessonViewed: toInt(value.lessonViewed),
    lessonCompleted: toInt(value.lessonCompleted),
    lessonNextClicked: toInt(value.lessonNextClicked),
  };
}

function normalizeDashboardMetrics(rawMetrics) {
  if (!rawMetrics || typeof rawMetrics !== 'object') {
    return INITIAL_DASHBOARD_METRICS;
  }

  return {
    totalUsers: toInt(rawMetrics.totalUsers),
    newUsersWeek: toInt(rawMetrics.newUsersWeek),
    newUsersMonth: toInt(rawMetrics.newUsersMonth),
    activeUsersWeek: toInt(rawMetrics.activeUsersWeek),
    totalCompletions: toInt(rawMetrics.totalCompletions),
    totalQuizAttempts: toInt(rawMetrics.totalQuizAttempts),
    totalBadges: toInt(rawMetrics.totalBadges),
    totalXP: toInt(rawMetrics.totalXP),
    topUsers: toTopUsers(rawMetrics.topUsers),
    funnel7d: toFunnel(rawMetrics.funnel7d),
    funnel30d: toFunnel(rawMetrics.funnel30d),
  };
}

export function useAdminData(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(INITIAL_DATA);
  const [dashboardMetrics, setDashboardMetrics] = useState(INITIAL_DASHBOARD_METRICS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fetchVersion, setFetchVersion] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setChecking(false);
        }
        return;
      }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setIsAdmin(!!profile?.is_admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setLoadError(null);
      try {
        const from = (usersPage - 1) * USERS_PAGE_SIZE;
        const to = from + USERS_PAGE_SIZE - 1;

        const [users, progress, quizScores, dashboardMetricsResult] = await Promise.all([
          supabase
            .from('admin_user_rollups')
            .select(
              'id, display_name, is_admin, is_disabled, created_at, lessons_done, xp_total, streak_days, badges_earned',
              { count: 'exact' },
            )
            .order('created_at', { ascending: false })
            .range(from, to),
          supabase
            .from('progress')
            .select('user_id, lesson_key, completed_at')
            .order('completed_at', { ascending: false })
            .limit(ADMIN_ANALYTICS_LIMIT),
          supabase
            .from('quiz_scores')
            .select('quiz_key, score, created_at')
            .order('created_at', { ascending: false })
            .limit(ADMIN_ANALYTICS_LIMIT),
          supabase.rpc('admin_dashboard_metrics'),
        ]);

        const errors = [
          ['admin_user_rollups', users.error],
          ['progress', progress.error],
          ['quiz_scores', quizScores.error],
          ['admin_dashboard_metrics', dashboardMetricsResult.error],
        ].filter(([, error]) => !!error);

        if (errors.length > 0) {
          const details = errors
            .map(([source, error]) => `${source}: ${error.message || 'Unknown error'}`)
            .join(' | ');
          throw new Error(details);
        }

        if (cancelled) return;

        const normalizedMetrics = normalizeDashboardMetrics(dashboardMetricsResult.data);
        setUsersTotal(users.count || normalizedMetrics.totalUsers || 0);
        setDashboardMetrics(normalizedMetrics);
        setData({
          users: users.data || [],
          progress: progress.data || [],
          quizScores: quizScores.data || [],
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error?.message
              ? `Failed to load admin data: ${error.message}`
              : 'Failed to load admin data. Check your connection.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [fetchVersion, isAdmin, usersPage]);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));

  useEffect(() => {
    if (usersPage > usersTotalPages) {
      setUsersPage(usersTotalPages);
    }
  }, [usersPage, usersTotalPages]);

  const goToUsersPage = useCallback(
    (page) => {
      const nextPage = Math.min(Math.max(1, page), usersTotalPages);
      setUsersPage(nextPage);
    },
    [usersTotalPages],
  );

  const nextUsersPage = useCallback(() => {
    setUsersPage((page) => Math.min(page + 1, usersTotalPages));
  }, [usersTotalPages]);

  const prevUsersPage = useCallback(() => {
    setUsersPage((page) => Math.max(page - 1, 1));
  }, []);

  return {
    isAdmin,
    checking,
    data,
    setData,
    dashboardMetrics,
    loading,
    loadError,
    refetch,
    usersCounts: {
      total: dashboardMetrics.totalUsers || usersTotal,
      newWeek: dashboardMetrics.newUsersWeek,
      newMonth: dashboardMetrics.newUsersMonth,
    },
    usersPagination: {
      page: usersPage,
      pageSize: USERS_PAGE_SIZE,
      totalPages: usersTotalPages,
      hasPrev: usersPage > 1,
      hasNext: usersPage < usersTotalPages,
      goToPage: goToUsersPage,
      nextPage: nextUsersPage,
      prevPage: prevUsersPage,
    },
    analyticsMeta: {
      rowLimit: ADMIN_ANALYTICS_LIMIT,
      progressTotalRows: dashboardMetrics.totalCompletions,
      quizTotalRows: dashboardMetrics.totalQuizAttempts,
      progressSampledRows: data.progress.length,
      quizSampledRows: data.quizScores.length,
      progressIsSampled: dashboardMetrics.totalCompletions > data.progress.length,
      quizIsSampled: dashboardMetrics.totalQuizAttempts > data.quizScores.length,
    },
  };
}
