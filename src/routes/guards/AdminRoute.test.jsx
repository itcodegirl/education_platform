import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('./GuardScreen', () => ({
  GuardScreen: ({ message }) => <div>{message}</div>,
}));

import { AdminRoute } from './AdminRoute';

function renderRoute() {
  return render(
    <AdminRoute fallback={<div>fallback</div>} loadingFallback={<div>loading</div>}>
      <div>admin-content</div>
    </AdminRoute>,
  );
}

describe('AdminRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('shows loading fallback while auth state is pending', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      profileLoading: false,
    });

    renderRoute();
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('returns fallback for signed-out users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
    });

    renderRoute();
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('returns fallback for non-admin profiles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-1' },
      profile: { is_admin: false, is_disabled: false },
      loading: false,
      profileLoading: false,
    });

    renderRoute();
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('returns fallback for disabled admins', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-1' },
      profile: { is_admin: true, is_disabled: true },
      loading: false,
      profileLoading: false,
    });

    renderRoute();
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('renders children for active admins', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-1' },
      profile: { is_admin: true, is_disabled: false },
      loading: false,
      profileLoading: false,
    });

    renderRoute();
    expect(screen.getByText('admin-content')).toBeInTheDocument();
  });
});
