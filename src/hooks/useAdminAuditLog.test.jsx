import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

import { useAdminAuditLog } from './useAdminAuditLog';

describe('useAdminAuditLog', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it('loads paginated audit rows through the server-side search rpc', async () => {
    mockRpc.mockResolvedValue({
      data: {
        total: 51,
        rows: [{
          id: 'audit-1',
          actor_id: 'admin-1',
          target_id: 'user-1',
          actorName: 'Jenna',
          targetName: 'Ava',
          action: 'grant_admin',
          details: { make_admin: true },
          created_at: '2026-05-17T00:00:00.000Z',
        }],
      },
      error: null,
    });

    const { result } = renderHook(() => useAdminAuditLog({
      action: 'grant_admin',
      range: '7d',
      search: ' Ava ',
      page: 2,
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows).toHaveLength(1);
    });

    expect(mockRpc).toHaveBeenCalledWith('search_admin_audit_log', {
      p_action: 'grant_admin',
      p_since: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      p_search: 'Ava',
      p_limit: 50,
      p_offset: 50,
    });
    expect(result.current.rows[0]).toMatchObject({
      actorName: 'Jenna',
      targetName: 'Ava',
    });
    expect(result.current.totalPages).toBe(2);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(false);
  });

  it('returns a user-facing error when the audit query fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: new Error('permission denied'),
    });

    const { result } = renderHook(() => useAdminAuditLog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toMatch(/permission denied/i);
    });

    expect(result.current.rows).toEqual([]);
  });
});
