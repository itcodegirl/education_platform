// ═══════════════════════════════════════════════
// AUDIT LOG SERVICE TESTS — Mocks the Supabase
// client so we can verify the service writes the
// exact row shape expected by public.admin_audit_log
// and fails gracefully when the insert errors.
// ═══════════════════════════════════════════════

import { describe, test, expect, beforeEach, vi } from 'vitest';

const insertSpy = vi.fn();

vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: insertSpy,
    })),
  },
}));

const { logAdminAction, AUDIT_ACTIONS } = await import('../../src/services/auditLogService.js');
const { supabase } = await import('../../src/lib/supabaseClient');

describe('logAdminAction', () => {
  beforeEach(() => {
    insertSpy.mockReset();
    supabase.from.mockClear();
    // Silence the intentional console.error calls in the error branches
    // so the test output stays clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('writes a well-formed row to admin_audit_log on a user_disabled action', async () => {
    insertSpy.mockResolvedValueOnce({ error: null });

    const result = await logAdminAction({
      adminId: 'admin-1',
      adminName: 'Alice',
      action: AUDIT_ACTIONS.USER_DISABLED,
      targetUserId: 'target-1',
      targetName: 'Bob',
    });

    expect(result).toEqual({ error: null });
    expect(supabase.from).toHaveBeenCalledWith('admin_audit_log');
    expect(insertSpy).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      admin_display_name: 'Alice',
      target_user_id: 'target-1',
      target_display_name: 'Bob',
      action: 'user_disabled',
      details: null,
    });
  });

  test('passes through a details payload for lesson_downloaded actions', async () => {
    insertSpy.mockResolvedValueOnce({ error: null });

    await logAdminAction({
      adminId: 'admin-1',
      adminName: 'Alice',
      action: AUDIT_ACTIONS.LESSON_DOWNLOADED,
      details: { module_title: 'Advanced Flexbox', module_id: 21, lesson_count: 3 },
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lesson_downloaded',
        details: { module_title: 'Advanced Flexbox', module_id: 21, lesson_count: 3 },
        target_user_id: null,
        target_display_name: null,
      }),
    );
  });

  test('coerces blank adminName to null so the NOT NULL column can accept it', async () => {
    insertSpy.mockResolvedValueOnce({ error: null });

    await logAdminAction({
      adminId: 'admin-1',
      adminName: '',
      action: AUDIT_ACTIONS.USER_ENABLED,
      targetUserId: 'target-1',
      targetName: '',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_display_name: null,
        target_display_name: null,
      }),
    );
  });

  test('returns { error } without throwing when the insert fails', async () => {
    const boom = new Error('RLS rejected the insert');
    insertSpy.mockResolvedValueOnce({ error: boom });

    const result = await logAdminAction({
      adminId: 'admin-1',
      adminName: 'Alice',
      action: AUDIT_ACTIONS.USER_DISABLED,
      targetUserId: 'target-1',
    });

    expect(result).toEqual({ error: boom });
    // The error branch logs to console — verify it actually ran.
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
  });

  test('rejects calls with no adminId without touching Supabase', async () => {
    const result = await logAdminAction({
      action: AUDIT_ACTIONS.USER_DISABLED,
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toMatch(/adminId is required/);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  test('rejects calls with no action without touching Supabase', async () => {
    const result = await logAdminAction({
      adminId: 'admin-1',
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toMatch(/action is required/);
    expect(insertSpy).not.toHaveBeenCalled();
  });
});
