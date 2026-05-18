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

export function normalizePayload(rawPayload) {
  const payload = typeof rawPayload === 'string'
    ? JSON.parse(rawPayload)
    : rawPayload;
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  return {
    total: Number.isFinite(Number(payload?.total)) ? Number(payload.total) : rows.length,
    rows: rows.map((row) => ({
      ...row,
      actorName: row.actorName || row.actor_name || '',
      targetName: row.targetName || row.target_name || '',
    })),
  };
}

export function useAdminAuditLog({ action = 'all', range = 'all', search = '', page = 1 } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const [fetchVersion, setFetchVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAuditLog() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const from = (page - 1) * AUDIT_LOG_PAGE_SIZE;
        const { data, error } = await supabase.rpc('search_admin_audit_log', {
          p_action: action === 'all' ? null : action,
          p_since: getAuditRangeStartIso(range),
          p_search: search.trim() || null,
          p_limit: AUDIT_LOG_PAGE_SIZE,
          p_offset: from,
        });
        if (error) throw error;

        const payload = normalizePayload(data);

        if (cancelled) return;

        setState({
          rows: payload.rows,
          total: payload.total,
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
  }, [action, fetchVersion, page, range, search]);

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
