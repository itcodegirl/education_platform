import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    fireEvent.click(screen.getByRole('menuitem', { name: /cheat sheets/i }));

    expect(onOpenTool).toHaveBeenCalledWith('cheatsheet');
  });

  it('marks desktop-collapsed sidebar as hidden and inert', () => {
    renderSidebar({ isCollapsed: true, isMobile: false });

    const nav = document.getElementById('course-sidebar');
    expect(nav).not.toBeNull();
    expect(nav).toHaveAttribute('aria-hidden', 'true');
    expect(nav).toHaveAttribute('inert');
  });

  it('supports keyboard navigation for menu-style resources popout', async () => {
    renderSidebar();
    const resourcesTab = screen.getByRole('button', { name: /resources/i });

    resourcesTab.focus();
    fireEvent.keyDown(resourcesTab, { key: 'ArrowDown' });

    const menu = await screen.findByRole('menu');
    const firstItem = await screen.findByRole('menuitem', { name: /open cheat sheets panel/i });
    const lastItem = await screen.findByRole('menuitem', { name: /open badges panel/i });

    await waitFor(() => expect(firstItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'End' });
    await waitFor(() => expect(lastItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'Home' });
    await waitFor(() => expect(firstItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(resourcesTab).toHaveFocus());
  });
});
