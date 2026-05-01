import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseAuth,
  mockUseTheme,
  mockSupabaseGetUser,
  mockSupabaseFrom,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseTheme: vi.fn(),
  mockSupabaseGetUser: vi.fn(),
  mockSupabaseFrom: vi.fn(),
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
      getUser: mockSupabaseGetUser,
    },
    from: mockSupabaseFrom,
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

import { ProtectedRoute, learnRouteAction } from './appRouter';

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
    mockSupabaseFrom.mockReset();
    mockSupabaseGetUser.mockReset();
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
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

describe('appRouter learnRouteAction', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    mockSupabaseGetUser.mockReset();
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  it('returns a recoverable progress write descriptor on lookup failure', async () => {
    const selectIn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'lookup failed' },
    });
    const selectEq = vi.fn(() => ({ in: selectIn }));
    const select = vi.fn(() => ({ eq: selectEq }));
    mockSupabaseFrom.mockReturnValueOnce({ select });

    const request = new Request('http://localhost/learn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'toggle-progress',
        lessonKey: 'HTML|Basics|Intro',
        mode: 'complete',
      }),
    });

    const response = await learnRouteAction({ request });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      intent: 'toggle-progress',
      error: 'lookup failed',
      recoverableWrite: {
        operation: 'addLesson',
        payload: {
          lessonKey: expect.any(String),
        },
      },
    });
    expect(select).toHaveBeenCalledWith('lesson_key');
    expect(selectEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(selectIn).toHaveBeenCalled();
  });

  it('returns a recoverable bookmark write descriptor on save failure', async () => {
    const selectIn = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const selectEq = vi.fn(() => ({ in: selectIn }));
    const select = vi.fn(() => ({ eq: selectEq }));
    const upsert = vi.fn().mockResolvedValue({
      error: { message: 'save failed' },
    });

    mockSupabaseFrom
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce({ upsert });

    const request = new Request('http://localhost/learn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'toggle-bookmark',
        lessonKey: 'HTML|Basics|Intro',
        courseId: 'html',
        lessonTitle: 'Intro',
        mode: 'save',
      }),
    });

    const response = await learnRouteAction({ request });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      intent: 'toggle-bookmark',
      error: 'save failed',
      recoverableWrite: {
        operation: 'addBookmark',
        payload: {
          bookmark: {
            lessonKey: expect.any(String),
            courseId: 'html',
            lessonTitle: 'Intro',
          },
        },
      },
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      course_id: 'html',
      lesson_title: 'Intro',
    }));
  });
});
