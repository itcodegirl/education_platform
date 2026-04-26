import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseAuth, mockUseTheme } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseTheme: vi.fn(),
}));

vi.mock('../providers', () => ({
  useAuth: mockUseAuth,
  useTheme: mockUseTheme,
  useProgressData: () => ({
    dataLoaded: true,
    loadError: null,
    retryLoad: vi.fn(),
  }),
  useCourseContent: () => ({
    ensureLoaded: vi.fn(),
  }),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../layouts/AuthLayout', () => ({
  AuthLayout: () => <div>auth-layout</div>,
}));

vi.mock('../layouts/AppLayout', () => ({
  AppLayout: () => <div>app-layout</div>,
}));

vi.mock('../components/shared/Logo', () => ({
  Logo: () => <span>logo</span>,
}));

import { ProtectedRoute } from './appRouter';

function renderProtectedRoute() {
  return render(
    <ProtectedRoute>
      <div>private-content</div>
    </ProtectedRoute>,
  );
}

describe('appRouter ProtectedRoute', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'dark' });
    mockUseAuth.mockReset();
  });

  it('waits for auth initialization before showing the auth layout', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      profileLoading: false,
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText(/Checking your account session/i)).toBeInTheDocument();
    expect(screen.queryByText('auth-layout')).not.toBeInTheDocument();
    expect(screen.queryByText('private-content')).not.toBeInTheDocument();
  });

  it('continues waiting while the restored user profile is still loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      loading: false,
      profileLoading: true,
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText(/Checking your account session/i)).toBeInTheDocument();
    expect(screen.queryByText('auth-layout')).not.toBeInTheDocument();
    expect(screen.queryByText('private-content')).not.toBeInTheDocument();
  });

  it('shows auth layout only after auth is initialized and no user exists', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('auth-layout')).toBeInTheDocument();
  });

  it('renders protected content for restored active users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { is_disabled: false },
      loading: false,
      profileLoading: false,
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('private-content')).toBeInTheDocument();
  });
});
