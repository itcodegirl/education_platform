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

// Safety cap — prevents an unbounded full-table scan as the platform
// grows. If any table returns exactly PAGE_SIZE rows we surface a
// warning in the UI so the admin knows results may be incomplete.
const PAGE_SIZE = 500;

const INITIAL_DATA = {
  users: [],
  progress: [],
  quizScores: [],
  xp: [],
  streaks: [],
  badges: [],
  truncated: [],   // list of table names that hit PAGE_SIZE
};

export function useAdminData(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fetchVersion, setFetchVersion] = useState(0);

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
        const [users, progress, quizScores, xp, streaks, badges] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
          supabase.from('progress').select('*').limit(PAGE_SIZE),
          supabase.from('quiz_scores').select('*').limit(PAGE_SIZE),
          supabase.from('xp').select('*').limit(PAGE_SIZE),
          supabase.from('streaks').select('*').limit(PAGE_SIZE),
          supabase.from('badges').select('*').limit(PAGE_SIZE),
        ]);
        const errors = [
          ['profiles', users.error],
          ['progress', progress.error],
          ['quiz_scores', quizScores.error],
          ['xp', xp.error],
          ['streaks', streaks.error],
          ['badges', badges.error],
        ].filter(([, error]) => !!error);

        if (errors.length > 0) {
          const details = errors
            .map(([source, error]) => `${source}: ${error.message || 'Unknown error'}`)
            .join(' | ');
          throw new Error(details);
        }

        const truncated = [
          ['users', users.data],
          ['progress', progress.data],
          ['quiz_scores', quizScores.data],
          ['xp', xp.data],
          ['streaks', streaks.data],
          ['badges', badges.data],
        ]
          .filter(([, rows]) => rows?.length === PAGE_SIZE)
          .map(([name]) => name);

        if (cancelled) return;
        setData({
          users: users.data || [],
          progress: progress.data || [],
          quizScores: quizScores.data || [],
          xp: xp.data || [],
          streaks: streaks.data || [],
          badges: badges.data || [],
          truncated,
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
  }, [isAdmin, fetchVersion]);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  return { isAdmin, checking, data, setData, loading, loadError, refetch };
}
