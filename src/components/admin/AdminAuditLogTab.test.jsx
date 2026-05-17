import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AdminAuditLogTab } from './AdminAuditLogTab';

const { mockUseAdminAuditLog } = vi.hoisted(() => ({
  mockUseAdminAuditLog: vi.fn(),
}));

vi.mock('../../hooks/useAdminAuditLog', () => ({
  useAdminAuditLog: (...args) => mockUseAdminAuditLog(...args),
}));

function makeAuditLog(overrides = {}) {
  return {
    rows: [
      {
        id: 'audit-1',
        actor_id: 'admin-1',
        actorName: 'Jenna',
        target_id: 'user-1',
        targetName: 'Ava',
        action: 'grant_admin',
        details: { make_admin: true },
        created_at: '2026-05-17T00:00:00.000Z',
      },
      {
        id: 'audit-2',
        actor_id: 'admin-2',
        actorName: 'Sam',
        target_id: 'user-2',
        targetName: 'Mia',
        action: 'disable_user',
        details: { make_disabled: true },
        created_at: '2026-05-16T00:00:00.000Z',
      },
    ],
    total: 2,
    loading: false,
    error: null,
    refetch: vi.fn(),
    pageSize: 50,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
    ...overrides,
  };
}

describe('AdminAuditLogTab', () => {
  beforeEach(() => {
    mockUseAdminAuditLog.mockReset();
    mockUseAdminAuditLog.mockReturnValue(makeAuditLog());
  });

  it('renders audit rows with action badges and profile labels', () => {
    render(<AdminAuditLogTab />);
    const table = screen.getByRole('table', { name: /admin audit events/i });

    expect(screen.getByRole('heading', { name: /audit log/i })).toBeInTheDocument();
    expect(within(table).getByText('Admin granted')).toBeInTheDocument();
    expect(within(table).getByText('User disabled')).toBeInTheDocument();
    expect(within(table).getByText('Jenna')).toBeInTheDocument();
    expect(within(table).getByText('Ava')).toBeInTheDocument();
  });

  it('filters visible rows by search term', () => {
    render(<AdminAuditLogTab />);

    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: 'mia' },
    });

    const table = screen.getByRole('table', { name: /admin audit events/i });
    expect(within(table).queryByText('Admin granted')).not.toBeInTheDocument();
    expect(within(table).getByText('User disabled')).toBeInTheDocument();
  });

  it('passes action and range filters into the audit log hook', () => {
    render(<AdminAuditLogTab />);

    fireEvent.change(screen.getByLabelText(/action/i), {
      target: { value: 'grant_admin' },
    });
    fireEvent.change(screen.getByLabelText(/range/i), {
      target: { value: '7d' },
    });

    expect(mockUseAdminAuditLog).toHaveBeenLastCalledWith({
      action: 'grant_admin',
      range: '7d',
      page: 1,
    });
  });

  it('calls refetch from the refresh control', () => {
    const refetch = vi.fn();
    mockUseAdminAuditLog.mockReturnValue(makeAuditLog({ refetch }));

    render(<AdminAuditLogTab />);

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state and disables csv export with no visible rows', () => {
    mockUseAdminAuditLog.mockReturnValue(makeAuditLog({ rows: [], total: 0 }));

    render(<AdminAuditLogTab />);

    expect(screen.getByText(/no audit events found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });
});
