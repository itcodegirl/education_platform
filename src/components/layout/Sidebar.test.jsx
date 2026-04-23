import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseProgressData.mockReturnValue({ completed: [] });
    mockUseAuth.mockReturnValue({ user: { email: 'jenna@example.com', user_metadata: {} } });
    mockUseLocalStorage.mockReturnValue([true, vi.fn()]);
  });

  it('locks sequential lessons when lock mode is enabled', () => {
    renderSidebar();

    const secondLesson = screen.getByRole('button', { name: /lesson two/i });
    expect(secondLesson).toBeDisabled();
  });

  it('opens Resources popout and triggers selected tool', () => {
    const onOpenTool = vi.fn();
    renderSidebar({ onOpenTool });

    fireEvent.click(screen.getByRole('button', { name: /resources/i }));
    fireEvent.click(screen.getByRole('button', { name: /cheat sheets/i }));

    expect(onOpenTool).toHaveBeenCalledWith('cheatsheet');
  });
});
