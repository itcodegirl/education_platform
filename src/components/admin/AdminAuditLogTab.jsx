import { useEffect, useState } from 'react';
import { useAdminAuditLog } from '../../hooks/useAdminAuditLog';
import {
  AUDIT_ACTION_FILTERS,
  AUDIT_RANGE_FILTERS,
  buildAuditLogCsv,
  formatAuditDetails,
  formatAuditName,
  getAuditActionLabel,
  getAuditActionTone,
} from '../../lib/adminAuditLog';

function formatAuditDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function downloadCsv(rows) {
  const csv = buildAuditLogCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function AuditLogPager({ page, totalPages, hasPrev, hasNext, onPrev, onNext, total, pageSize }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="admin-pager" role="navigation" aria-label="Audit log pagination">
      <div className="admin-pager-meta">
        Showing {start}-{end} of {total}
      </div>
      <div className="admin-pager-actions">
        <button
          type="button"
          className="admin-page-btn"
          aria-label="Go to previous audit log page"
          onClick={onPrev}
          disabled={!hasPrev}
        >
          &lt; Prev
        </button>
        <span className="admin-page-indicator">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="admin-page-btn"
          aria-label="Go to next audit log page"
          onClick={onNext}
          disabled={!hasNext}
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}

export function AdminAuditLogTab() {
  const [actionFilter, setActionFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const auditLog = useAdminAuditLog({
    action: actionFilter,
    range: rangeFilter,
    search: searchTerm,
    page,
  });

  useEffect(() => {
    if (page > auditLog.totalPages) {
      setPage(auditLog.totalPages);
    }
  }, [auditLog.totalPages, page]);

  const visibleRows = auditLog.rows;

  const handleActionFilterChange = (event) => {
    setActionFilter(event.target.value);
    setPage(1);
  };

  const handleRangeFilterChange = (event) => {
    setRangeFilter(event.target.value);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setActionFilter('all');
    setRangeFilter('30d');
    setSearchTerm('');
    setPage(1);
  };

  return (
    <section className="admin-section" aria-labelledby="admin-audit-log-title">
      <div className="admin-audit-head">
        <div>
          <h3 id="admin-audit-log-title" className="admin-section-title">Audit Log</h3>
          <p className="admin-audit-meta">
            {visibleRows.length} visible / {auditLog.total} matching
          </p>
        </div>
        <div className="admin-audit-actions">
          <button
            type="button"
            className="admin-quality-filter-clear"
            onClick={auditLog.refetch}
            disabled={auditLog.loading}
          >
            Refresh
          </button>
          <button
            type="button"
            className="admin-audit-export"
            onClick={() => downloadCsv(visibleRows)}
            disabled={visibleRows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-audit-filters" aria-label="Audit log filters">
        <label className="admin-quality-filter">
          <span>Action</span>
          <select
            value={actionFilter}
            onChange={handleActionFilterChange}
          >
            {AUDIT_ACTION_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="admin-quality-filter">
          <span>Range</span>
          <select
            value={rangeFilter}
            onChange={handleRangeFilterChange}
          >
            {AUDIT_RANGE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="admin-quality-filter admin-audit-search">
          <span>Search</span>
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Name, ID, action, details"
          />
        </label>
        <button type="button" className="admin-quality-filter-clear" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {auditLog.error && (
        <p className="admin-action-error" role="alert">
          {auditLog.error}
        </p>
      )}

      {auditLog.loading ? (
        <div className="admin-loading" role="status" aria-live="polite">Loading audit log...</div>
      ) : (
        <>
          <AuditLogPager
            page={page}
            totalPages={auditLog.totalPages}
            hasPrev={auditLog.hasPrev}
            hasNext={auditLog.hasNext}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(auditLog.totalPages, current + 1))}
            total={auditLog.total}
            pageSize={auditLog.pageSize}
          />
          <div className="admin-table-wrap">
            <table className="admin-table admin-audit-table">
              <caption className="sr-only">
                Admin audit events with action, actor, target, details, and timestamp.
              </caption>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-date">{formatAuditDate(row.created_at)}</td>
                    <td>
                      <span className={`admin-audit-action ${getAuditActionTone(row.action)}`}>
                        {getAuditActionLabel(row.action)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-quality-item">
                        {formatAuditName(row.actorName, row.actor_id)}
                      </span>
                      <span className="admin-quality-path">{row.actor_id}</span>
                    </td>
                    <td>
                      <span className="admin-quality-item">
                        {formatAuditName(row.targetName, row.target_id)}
                      </span>
                      <span className="admin-quality-path">{row.target_id}</span>
                    </td>
                    <td className="admin-audit-details">{formatAuditDetails(row.details)}</td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty">No audit events found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AuditLogPager
            page={page}
            totalPages={auditLog.totalPages}
            hasPrev={auditLog.hasPrev}
            hasNext={auditLog.hasNext}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(auditLog.totalPages, current + 1))}
            total={auditLog.total}
            pageSize={auditLog.pageSize}
          />
        </>
      )}
    </section>
  );
}
