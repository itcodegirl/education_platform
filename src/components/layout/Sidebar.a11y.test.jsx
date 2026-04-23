import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
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
  QUIZ_MAP: new Map(),
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

function renderSidebar() {
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
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
