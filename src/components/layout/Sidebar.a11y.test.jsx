import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Sidebar } from './Sidebar';

const { mockUseProgressData, mockUseAuth, mockUseLocalStorage } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseLocalStorage: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: (...args) => mockUseLocalStorage(...args),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

vi.mock('../../data', () => ({
  hasQuiz: () => false,
}));

vi.mock('./ProfilePopover', () => ({
  ProfilePopover: () => null,
}));

vi.mock('../shared/Logo', () => ({
  Logo: ({ className = '' }) => <span className={className}>Logo</span>,
}));

const baseCourses = [
  {
    id: 'html',
    label: 'HTML',
    icon: 'H',
    accent: '#ff6b6b',
    modules: [
      {
        id: 1,
        title: 'Foundations',
        emoji: '📘',
        lessons: [
          { id: 'h1', title: 'Lesson One' },
          { id: 'h2', title: 'Lesson Two' },
        ],
      },
    ],
  },
];

function renderSidebar(overrides = {}) {
  return render(
    <Sidebar
      courses={baseCourses}
      courseIdx={0}
      modIdx={0}
      lesIdx={0}
      showModQuiz={false}
      isOpen
      isMobile={false}
      isCollapsed={false}
      onClose={() => {}}
      onToggleCollapse={() => {}}
      onSelectCourse={() => {}}
      onSelectLesson={() => {}}
      onSelectModQuiz={() => {}}
      onOpenTool={() => {}}
      activePanel={null}
      {...overrides}
    />,
  );
}

describe('Sidebar accessibility', () => {
  beforeEach(() => {
    mockUseProgressData.mockReturnValue({ completed: [] });
    mockUseAuth.mockReturnValue({ user: { email: 'jenna@example.com', user_metadata: {} } });
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
  });

  it('has no detectable accessibility violations in the default state', async () => {
    const { container } = renderSidebar();
    // Keep color-contrast in real-browser Playwright coverage. JSDOM
    // does not compute rendered contrast reliably enough for this unit
    // check to be authoritative.
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  }, 15000);

  it('keeps the closed mobile drawer inert and out of the tab order', async () => {
    const { container } = renderSidebar({
      isOpen: false,
      isMobile: true,
    });

    const shell = container.querySelector('.sidebar-shell');
    const nav = container.querySelector('#course-sidebar');
    expect(shell).toHaveAttribute('aria-hidden', 'true');
    expect(shell).toHaveAttribute('inert', '');
    expect(nav).toHaveAttribute('aria-hidden', 'true');
    expect(nav).toHaveAttribute('inert', '');

    await waitFor(() => {
      expect(container.querySelector('.sidebar-avatar')).toHaveAttribute('tabindex', '-1');
      expect(container.querySelector('.module-group-btn')).toHaveAttribute('tabindex', '-1');
      expect(container.querySelector('.sidebar-close')).toHaveAttribute('tabindex', '-1');
    });
  });
});
