import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminUsersTab } from './AdminUsersTab';

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
  },
}));

describe('AdminUsersTab', () => {
  const baseProps = {
    currentUserId: 'admin-1',
    setData: vi.fn(),
    usersPagination: {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
      prevPage: vi.fn(),
      nextPage: vi.fn(),
    },
    usersTotal: 1,
  };

  beforeEach(() => {
    mockRpc.mockReset();
    baseProps.setData.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('disables a user through the sanctioned rpc path', async () => {
    mockRpc.mockResolvedValue({ error: null });

    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'user-1',
            display_name: 'Learner One',
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /disable user learner one/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_user_disabled', {
        target_user_id: 'user-1',
        make_disabled: true,
      });
    });
  });

  it('grants admin access through the sanctioned rpc path', async () => {
    mockRpc.mockResolvedValue({ error: null });

    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'user-1',
            display_name: 'Learner One',
            is_admin: false,
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /grant admin access to learner one/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_user_admin', {
        target_user_id: 'user-1',
        make_admin: true,
      });
    });
    expect(baseProps.setData).toHaveBeenCalled();
  });

  it('removes admin access from another admin through the sanctioned rpc path', async () => {
    mockRpc.mockResolvedValue({ error: null });

    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'admin-2',
            display_name: 'Admin Two',
            is_admin: true,
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove admin access from admin two/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_user_admin', {
        target_user_id: 'admin-2',
        make_admin: false,
      });
    });
  });

  it('does not expose self-demotion controls for the current admin', () => {
    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'admin-1',
            display_name: 'Current Admin',
            is_admin: true,
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    expect(screen.getByText(/admin locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove admin access from current admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disable user current admin/i })).not.toBeInTheDocument();
  });

  it('shows a role-specific error when admin role changes fail', async () => {
    mockRpc.mockResolvedValue({ error: new Error('denied') });

    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'user-1',
            display_name: 'Learner One',
            is_admin: false,
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /grant admin access to learner one/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not grant admin access to learner one/i);
  });

  it('labels the users table for assistive technology', () => {
    render(
      <AdminUsersTab
        {...baseProps}
        data={{
          users: [{
            id: 'user-1',
            display_name: 'Learner One',
            is_disabled: false,
            lessons_done: 0,
            xp_total: 0,
            streak_days: 0,
            badges_earned: 0,
            created_at: '2026-05-06T00:00:00.000Z',
          }],
        }}
      />,
    );

    expect(screen.getByRole('table', { name: /admin user accounts/i })).toBeInTheDocument();
  });
});
