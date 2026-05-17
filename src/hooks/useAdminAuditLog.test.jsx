import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

import { useAdminAuditLog } from './useAdminAuditLog';

function makeAuditChain(result) {
  const rangeResult = Promise.resolve(result);
  const chain = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    range: vi.fn(() => rangeResult),
  };
  return chain;
}

function makeProfilesChain(result) {
  const inResult = Promise.resolve(result);
  const chain = {
    select: vi.fn(() => chain),
    in: vi.fn(() => inResult),
  };
  return chain;
}

describe('useAdminAuditLog', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('loads paginated audit rows and resolves profile names', async () => {
    const auditChain = makeAuditChain({
      data: [{
        id: 'audit-1',
        actor_id: 'admin-1',
        target_id: 'user-1',
        action: 'grant_admin',
        details: { make_admin: true },
        created_at: '2026-05-17T00:00:00.000Z',
      }],
      error: null,
      count: 51,
    });
    const profilesChain = makeProfilesChain({
      data: [
        { id: 'admin-1', display_name: 'Jenna' },
        { id: 'user-1', display_name: 'Ava' },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table) => {
      if (table === 'admin_audit_log') return auditChain;
      if (table === 'profiles') return profilesChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAdminAuditLog({
      action: 'grant_admin',
      range: '7d',
      page: 2,
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows).toHaveLength(1);
    });

    expect(auditChain.select).toHaveBeenCalledWith(
      'id, actor_id, target_id, action, details, created_at',
      { count: 'exact' },
    );
    expect(auditChain.eq).toHaveBeenCalledWith('action', 'grant_admin');
    expect(auditChain.gte).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    expect(auditChain.range).toHaveBeenCalledWith(50, 99);
    expect(profilesChain.in).toHaveBeenCalledWith('id', ['admin-1', 'user-1']);
    expect(result.current.rows[0]).toMatchObject({
      actorName: 'Jenna',
      targetName: 'Ava',
    });
    expect(result.current.totalPages).toBe(2);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(false);
  });

  it('returns a user-facing error when the audit query fails', async () => {
    const auditChain = makeAuditChain({
      data: null,
      error: new Error('permission denied'),
      count: null,
    });

    mockFrom.mockImplementation((table) => {
      if (table === 'admin_audit_log') return auditChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAdminAuditLog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toMatch(/permission denied/i);
    });

    expect(result.current.rows).toEqual([]);
  });
});
