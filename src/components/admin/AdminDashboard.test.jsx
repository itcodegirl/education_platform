import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';

const {
  mockUseAuth,
  mockUseCourseContent,
  mockUseAdminData,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseCourseContent: vi.fn(),
  mockUseAdminData: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useAuth: () => mockUseAuth(),
  useCourseContent: () => mockUseCourseContent(),
}));

vi.mock('../../hooks/useAdminData', () => ({
  useAdminData: (...args) => mockUseAdminData(...args),
}));

vi.mock('../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

function makeAdminData(overrides = {}) {
  return {
    isAdmin: true,
    checking: false,
    data: { progress: [], quizScores: [], users: [] },
    setData: vi.fn(),
    dashboardMetrics: {
      totalCompletions: 0,
      activeUsersWeek: 0,
      totalQuizAttempts: 0,
      totalBadges: 0,
      totalXP: 0,
      topUsers: [],
      funnel7d: {},
      funnel30d: {},
      reliability7d: {},
      reliability30d: {},
    },
    loading: false,
    loadError: '',
    usersCounts: { total: 0, newWeek: 0, newMonth: 0 },
    usersPagination: {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
      prevPage: vi.fn(),
      nextPage: vi.fn(),
    },
    analyticsMeta: { progressIsSampled: false, quizIsSampled: false },
    ...overrides,
  };
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'admin-1' } });
    mockUseCourseContent.mockReturnValue({ ensureAllLoaded: vi.fn(), allCoursesLoaded: true });
    mockUseAdminData.mockReturnValue(makeAdminData());
  });

  it('uses a single clear retry label when dashboard data fails to load', () => {
    mockUseAdminData.mockReturnValue(makeAdminData({
      loadError: 'Could not load admin metrics.',
    }));

    render(<AdminDashboard onClose={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Connection Error/i);
    expect(screen.getByRole('button', { name: /reload the admin dashboard/i })).toHaveTextContent(/^Retry$/);
    expect(screen.queryByText(/Retry Retry/i)).not.toBeInTheDocument();
  });

  it('includes a content QA tab for curriculum maintenance', () => {
    render(<AdminDashboard onClose={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /content qa/i })).toBeInTheDocument();
  });
});
