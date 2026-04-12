// ═══════════════════════════════════════════════
// AUDIT LOG TAB — Read-only view of the last 200
// admin actions. Backed by public.admin_audit_log
// (see supabase-schema.sql). Only admins can read.
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const ACTION_LABELS = {
  user_disabled:     { icon: '🚫', label: 'Disabled user',    tone: 'disable' },
  user_enabled:      { icon: '✅', label: 'Enabled user',     tone: 'enable'  },
  lesson_downloaded: { icon: '⬇️', label: 'Downloaded lesson', tone: 'neutral' },
  lesson_copied:     { icon: '📋', label: 'Copied lesson',     tone: 'neutral' },
};

// Render the `details` jsonb column as a compact, readable summary.
// Returns null when there's nothing useful to show so the cell stays empty.
function formatDetails(entry) {
  if (!entry.details) return null;
  const { module_title, module_id, lesson_count } = entry.details;
  if (entry.action === 'lesson_downloaded' || entry.action === 'lesson_copied') {
    const parts = [];
    if (module_title) parts.push(`"${module_title}"`);
    if (module_id) parts.push(`id=${module_id}`);
    if (typeof lesson_count === 'number') {
      parts.push(`${lesson_count} lesson${lesson_count === 1 ? '' : 's'}`);
    }
    return parts.join(' · ') || null;
  }
  return null;
}

export function AuditLogTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('admin_audit_log')
        .select('id, admin_display_name, target_display_name, action, details, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (err) {
        setError(err.message || 'Failed to load audit log');
        setEntries([]);
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading audit log...</div>;
  }

  if (error) {
    return (
      <div className="admin-section">
        <h3 className="admin-section-title">🗒️ Audit Log</h3>
        <p className="admin-empty">Could not load audit log: {error}</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">🗒️ Audit Log (last 200 actions)</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Admin</th>
              <th scope="col">Action</th>
              <th scope="col">Target / Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const action = ACTION_LABELS[entry.action] || {
                icon: '•',
                label: entry.action,
                tone: 'neutral',
              };
              const detailText = formatDetails(entry);
              return (
                <tr key={entry.id}>
                  <td className="admin-date">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td>{entry.admin_display_name || 'Unknown admin'}</td>
                  <td>
                    <span className={`admin-status ${action.tone}`}>
                      {action.icon} {action.label}
                    </span>
                  </td>
                  <td>{entry.target_display_name || detailText || '—'}</td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-empty">No admin actions logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

