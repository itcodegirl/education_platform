// ═══════════════════════════════════════════════
// useAdminData — admin access check + parallel data fetch
//
// Split out of the old 520-LOC AdminDashboard component per the
// portfolio audit. Handles:
//   1. Checking the caller's is_admin flag on profiles
//   2. If admin, fetching users/progress/quizzes/xp/streaks/badges
//      in one parallel round-trip
//   3. Surfacing loading / error / retry state
//   4. Exposing setData so tabs can do optimistic updates (e.g. the
//      users tab's enable/disable action)
//
// Returned shape:
//   {
//     isAdmin,        // true once confirmed
//     checking,       // true while the is_admin check is in flight
//     data,           // the six fetched tables
//     setData,        // setter for optimistic updates
//     loading,        // true while the data fetch is in flight
//     loadError,      // string | null
//     refetch,        // () => void  — retry the data fetch
//   }
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const USERS_PAGE_SIZE = 25;
const ADMIN_ANALYTICS_LIMIT = 5000;

const INITIAL_DATA = {
  users: [],
  progress: [],
  quizScores: [],
  xp: [],
  streaks: [],
  badges: [],
};

export function useAdminData(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fetchVersion, setFetchVersion] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [newUsersWeek, setNewUsersWeek] = useState(0);
  const [newUsersMonth, setNewUsersMonth] = useState(0);
  const [progressTotalRows, setProgressTotalRows] = useState(0);
  const [quizTotalRows, setQuizTotalRows] = useState(0);

  // Admin check — runs once per authenticated user. A failure here
  // defaults to NOT admin (closed rather than open).
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
    return () => { cancelled = true; };
  }, [user]);

  // Data fetch — only runs after admin is confirmed. The parallel
  // Promise.all is intentional: six independent reads, no reason to
  // serialize them. fetchVersion re-triggers on manual refetch().
  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      setLoadError(null);
      try {
        const now = new Date();
        const weekAgoISO = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgoISO = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        const from = (usersPage - 1) * USERS_PAGE_SIZE;
        const to = from + USERS_PAGE_SIZE - 1;

        const [users, progress, quizScores, xp, streaks, badges, usersWeekCount, usersMonthCount, progressCount, quizCount] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, email, is_admin, is_disabled, created_at', { count: 'exact' })
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
          supabase.from('xp').select('user_id, total'),
          supabase.from('streaks').select('user_id, days'),
          supabase.from('badges').select('user_id, badge_id'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoISO),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgoISO),
          supabase.from('progress').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_scores').select('*', { count: 'exact', head: true }),
        ]);
        const errors = [
          ['profiles', users.error],
          ['progress', progress.error],
          ['quiz_scores', quizScores.error],
          ['xp', xp.error],
          ['streaks', streaks.error],
          ['badges', badges.error],
          ['profiles_week_count', usersWeekCount.error],
          ['profiles_month_count', usersMonthCount.error],
          ['progress_count', progressCount.error],
          ['quiz_count', quizCount.error],
        ].filter(([, error]) => !!error);

        if (errors.length > 0) {
          const details = errors
            .map(([source, error]) => `${source}: ${error.message || 'Unknown error'}`)
            .join(' | ');
          throw new Error(details);
        }

        if (cancelled) return;
        setUsersTotal(users.count || 0);
        setNewUsersWeek(usersWeekCount.count || 0);
        setNewUsersMonth(usersMonthCount.count || 0);
        setProgressTotalRows(progressCount.count || 0);
        setQuizTotalRows(quizCount.count || 0);
        setData({
          users: users.data || [],
          progress: progress.data || [],
          quizScores: quizScores.data || [],
          xp: xp.data || [],
          streaks: streaks.data || [],
          badges: badges.data || [],
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
    return () => { cancelled = true; };
  }, [isAdmin, fetchVersion, usersPage]);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));

  useEffect(() => {
    if (usersPage > usersTotalPages) {
      setUsersPage(usersTotalPages);
    }
  }, [usersPage, usersTotalPages]);

  const goToUsersPage = useCallback((page) => {
    const nextPage = Math.min(Math.max(1, page), usersTotalPages);
    setUsersPage(nextPage);
  }, [usersTotalPages]);

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
    loading,
    loadError,
    refetch,
    usersCounts: {
      total: usersTotal,
      newWeek: newUsersWeek,
      newMonth: newUsersMonth,
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
      progressTotalRows,
      quizTotalRows,
      progressSampledRows: data.progress.length,
      quizSampledRows: data.quizScores.length,
      progressIsSampled: progressTotalRows > data.progress.length,
      quizIsSampled: quizTotalRows > data.quizScores.length,
    },
  };
}
