import { describe, expect, it } from 'vitest';
import {
  buildAuditLogCsv,
  filterAuditRows,
  formatAuditDetails,
  getAuditActionLabel,
  getAuditActionTone,
  getAuditRangeStartIso,
} from './adminAuditLog';

describe('adminAuditLog helpers', () => {
  it('formats known and unknown audit actions', () => {
    expect(getAuditActionLabel('grant_admin')).toBe('Admin granted');
    expect(getAuditActionTone('grant_admin')).toBe('warning');
    expect(getAuditActionLabel('custom_action')).toBe('Custom Action');
    expect(getAuditActionTone('custom_action')).toBe('neutral');
  });

  it('derives range start timestamps from the selected audit range', () => {
    const now = new Date('2026-05-17T12:00:00.000Z');

    expect(getAuditRangeStartIso('7d', now)).toBe('2026-05-10T12:00:00.000Z');
    expect(getAuditRangeStartIso('all', now)).toBeNull();
  });

  it('filters audit rows by names, labels, ids, and details', () => {
    const rows = [
      {
        action: 'grant_admin',
        actorName: 'Jenna',
        targetName: 'Ava',
        actor_id: 'admin-1',
        target_id: 'user-1',
        details: { make_admin: true },
        created_at: '2026-05-17T00:00:00.000Z',
      },
      {
        action: 'disable_user',
        actorName: 'Sam',
        targetName: 'Mia',
        actor_id: 'admin-2',
        target_id: 'user-2',
        details: { make_disabled: true },
        created_at: '2026-05-16T00:00:00.000Z',
      },
    ];

    expect(filterAuditRows(rows, 'ava')).toHaveLength(1);
    expect(filterAuditRows(rows, 'admin granted')).toHaveLength(1);
    expect(filterAuditRows(rows, 'make disabled')).toHaveLength(1);
  });

  it('builds escaped csv for visible audit rows', () => {
    const csv = buildAuditLogCsv([
      {
        action: 'grant_admin',
        actorName: 'Jenna "Admin"',
        targetName: 'Ava',
        actor_id: 'admin-1',
        target_id: 'user-1',
        details: { make_admin: true },
        created_at: '2026-05-17T00:00:00.000Z',
      },
    ]);

    expect(csv).toContain('"Timestamp","Action","Actor","Actor ID","Target","Target ID","Details"');
    expect(csv).toContain('"Admin granted"');
    expect(csv).toContain('"Jenna ""Admin"""');
    expect(csv).toContain('"Make Admin: true"');
  });

  it('uses a stable fallback for empty details', () => {
    expect(formatAuditDetails(null)).toBe('No details');
    expect(formatAuditDetails({})).toBe('No details');
  });
});
