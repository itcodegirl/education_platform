import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAuditRangeStartIso } from '../lib/adminAuditLog';

const AUDIT_LOG_PAGE_SIZE = 50;

const INITIAL_STATE = {
  rows: [],
  total: 0,
  loading: false,
  error: null,
};

async function loadProfileNames(rows) {
  const ids = Array.from(new Set(
    rows.flatMap((row) => [row.actor_id, row.target_id]).filter(Boolean),
  ));

  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load audit profile labels:', error);
    }
    return new Map();
  }

  return new Map(
    (data || []).map((profile) => [profile.id, profile.display_name || 'Anonymous']),
  );
}

export function useAdminAuditLog({ action = 'all', range = 'all', page = 1 } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const [fetchVersion, setFetchVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAuditLog() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const from = (page - 1) * AUDIT_LOG_PAGE_SIZE;
        const to = from + AUDIT_LOG_PAGE_SIZE - 1;
        let query = supabase
          .from('admin_audit_log')
          .select('id, actor_id, target_id, action, details, created_at', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (action !== 'all') {
          query = query.eq('action', action);
        }

        const since = getAuditRangeStartIso(range);
        if (since) {
          query = query.gte('created_at', since);
        }

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;

        const rows = data || [];
        const profileNames = await loadProfileNames(rows);

        if (cancelled) return;

        setState({
          rows: rows.map((row) => ({
            ...row,
            actorName: profileNames.get(row.actor_id) || '',
            targetName: profileNames.get(row.target_id) || '',
          })),
          total: count || rows.length,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!cancelled) {
          setState({
            rows: [],
            total: 0,
            loading: false,
            error: error?.message || 'Failed to load audit log.',
          });
        }
      }
    }

    fetchAuditLog();
    return () => {
      cancelled = true;
    };
  }, [action, fetchVersion, page, range]);

  const refetch = useCallback(() => {
    setFetchVersion((version) => version + 1);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(state.total / AUDIT_LOG_PAGE_SIZE)),
    [state.total],
  );

  return {
    ...state,
    refetch,
    pageSize: AUDIT_LOG_PAGE_SIZE,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
