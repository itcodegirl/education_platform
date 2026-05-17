import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInsert, mockFrom } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

import { AUDIT_ACTIONS, logAdminAction } from './auditLogService';

describe('auditLogService', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('writes audit rows with the current schema columns', async () => {
    const result = await logAdminAction({
      adminId: 'admin-1',
      adminName: 'Jenna',
      targetUserId: 'user-1',
      targetName: 'Ava',
      action: AUDIT_ACTIONS.ADMIN_GRANTED,
      details: { make_admin: true },
    });

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('admin_audit_log');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'admin-1',
      target_id: 'user-1',
      action: 'grant_admin',
      details: {
        make_admin: true,
        actorName: 'Jenna',
        targetName: 'Ava',
      },
    });
  });

  it('fails locally before writing incomplete audit rows', async () => {
    const result = await logAdminAction({
      adminId: 'admin-1',
      action: AUDIT_ACTIONS.USER_DISABLED,
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
