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

function installNavigationStorage(initialValue = null) {
  let debugValue = initialValue;
  const storage = {
    getItem: vi.fn((key) => (key === 'debug-navigation' ? debugValue : null)),
    setItem: vi.fn((key, value) => {
      if (key === 'debug-navigation') debugValue = value;
    }),
    removeItem: vi.fn((key) => {
      if (key === 'debug-navigation') debugValue = null;
    }),
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
  return storage;
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installNavigationStorage();
    mockUseProgressData.mockReturnValue({ completed: [] });
    mockUseAuth.mockReturnValue({ user: { email: 'jenna@example.com', user_metadata: {} } });
    mockUseLocalStorage.mockReturnValue([true, vi.fn()]);
  });

  it('locks sequential lessons when lock mode is enabled', () => {
    renderSidebar();

    const secondLesson = screen.getByRole('button', { name: /lesson two/i });
    expect(secondLesson).toBeDisabled();
  });

  it('fires lesson navigation clicks when free-roam mode is enabled', () => {
    const onSelectLesson = vi.fn();
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
    renderSidebar({ onSelectLesson });

    fireEvent.click(screen.getByRole('button', { name: /lesson two/i }));

    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('logs gated navigation diagnostics when a lesson click fires', () => {
    const onSelectLesson = vi.fn();
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    window.localStorage.setItem('debug-navigation', 'true');
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
    renderSidebar({ onSelectLesson });

    fireEvent.click(screen.getByRole('button', { name: /lesson two/i }));

    expect(infoSpy).toHaveBeenCalledWith(
      '[CodeHerWay navigation]',
      'lesson-click-fired',
      expect.objectContaining({
        targetLessonId: 'h2',
        targetModuleId: 1,
        unlocked: true,
        lockMode: false,
      }),
    );
    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('allows completed sequential lessons to navigate without reward-processing gates', () => {
    const onSelectLesson = vi.fn();
    mockUseProgressData.mockReturnValue({ completed: ['c:html|m:1|l:h1'] });
    mockUseLocalStorage.mockReturnValue([true, vi.fn()]);
    renderSidebar({ onSelectLesson });

    const secondLesson = screen.getByRole('button', { name: /lesson two/i });
    expect(secondLesson).not.toBeDisabled();

    fireEvent.click(secondLesson);

    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('keeps sidebar lesson clicks available when hidden app chrome is present', () => {
    const onSelectLesson = vi.fn();
    const hiddenToolbar = document.createElement('div');
    hiddenToolbar.className = 'bottom-tools';
    hiddenToolbar.style.pointerEvents = 'none';
    document.body.appendChild(hiddenToolbar);
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
    renderSidebar({ onSelectLesson });

    fireEvent.click(screen.getByRole('button', { name: /lesson two/i }));

    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('marks the mobile drawer backdrop as the only active click overlay', () => {
    renderSidebar({ isMobile: true, isOpen: true });

    const overlay = document.querySelector('.overlay');
    expect(overlay).toHaveClass('overlay-open');
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
