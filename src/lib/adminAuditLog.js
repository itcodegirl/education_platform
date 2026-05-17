export const AUDIT_ACTION_FILTERS = [
  { value: 'all', label: 'All actions' },
  { value: 'grant_admin', label: 'Admin granted' },
  { value: 'revoke_admin', label: 'Admin removed' },
  { value: 'disable_user', label: 'User disabled' },
  { value: 'enable_user', label: 'User enabled' },
];

export const AUDIT_RANGE_FILTERS = [
  { value: 'all', label: 'All time', days: null },
  { value: '1d', label: 'Last 24 hours', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
];

const ACTION_LABELS = {
  disable_user: 'User disabled',
  enable_user: 'User enabled',
  grant_admin: 'Admin granted',
  revoke_admin: 'Admin removed',
  lesson_copied: 'Lesson copied',
  lesson_downloaded: 'Lesson downloaded',
  user_disabled: 'User disabled',
  user_enabled: 'User enabled',
};

const ACTION_TONES = {
  disable_user: 'danger',
  enable_user: 'success',
  grant_admin: 'warning',
  revoke_admin: 'danger',
  lesson_copied: 'neutral',
  lesson_downloaded: 'neutral',
  user_disabled: 'danger',
  user_enabled: 'success',
};

function humanize(value) {
  return String(value || 'Unknown action')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getAuditActionLabel(action) {
  return ACTION_LABELS[action] || humanize(action);
}

export function getAuditActionTone(action) {
  return ACTION_TONES[action] || 'neutral';
}

export function getAuditRangeStartIso(rangeValue, now = new Date()) {
  const range = AUDIT_RANGE_FILTERS.find((item) => item.value === rangeValue);
  if (!range?.days) return null;
  return new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000).toISOString();
}

export function formatAuditName(name, id) {
  if (name && String(name).trim()) return String(name).trim();
  if (!id) return 'Unknown';
  return `${String(id).slice(0, 8)}...`;
}

export function formatAuditDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return 'No details';
  }

  const entries = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${humanize(key)}: ${String(value)}`);

  return entries.length > 0 ? entries.join('; ') : 'No details';
}

export function filterAuditRows(rows, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) => {
    const haystack = [
      row.actorName,
      row.targetName,
      row.actor_id,
      row.target_id,
      row.action,
      getAuditActionLabel(row.action),
      formatAuditDetails(row.details),
      row.created_at,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildAuditLogCsv(rows) {
  const header = ['Timestamp', 'Action', 'Actor', 'Actor ID', 'Target', 'Target ID', 'Details'];
  const lines = rows.map((row) => [
    row.created_at || '',
    getAuditActionLabel(row.action),
    formatAuditName(row.actorName, row.actor_id),
    row.actor_id || '',
    formatAuditName(row.targetName, row.target_id),
    row.target_id || '',
    formatAuditDetails(row.details),
  ]);

  return [header, ...lines]
    .map((line) => line.map(csvEscape).join(','))
    .join('\n');
}
