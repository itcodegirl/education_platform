import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const { mockUseProgressData, mockUseAuth, mockUseLocalStorage, mockUseFocusTrap } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseLocalStorage: vi.fn(),
  mockUseFocusTrap: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: (...args) => mockUseLocalStorage(...args),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: (...args) => mockUseFocusTrap(...args),
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
    document.querySelectorAll('.bottom-tools').forEach((element) => element.remove());
    installNavigationStorage();
    mockUseProgressData.mockReturnValue({ completed: [] });
    mockUseAuth.mockReturnValue({ user: { email: 'jenna@example.com', user_metadata: {} } });
    mockUseLocalStorage.mockReturnValue([true, vi.fn()]);
    mockUseFocusTrap.mockClear();
  });

  it('locks sequential lessons when lock mode is enabled', () => {
    renderSidebar();

    const secondLesson = screen.getByRole('button', { name: /lesson two/i });
    expect(secondLesson).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows visible lesson readiness states', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: /lesson one lesson, ready/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lesson two lesson, locked/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('fires lesson navigation clicks when free-roam mode is enabled', () => {
    const onSelectLesson = vi.fn();
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
    renderSidebar({ onSelectLesson });

    fireEvent.click(screen.getByRole('button', { name: /lesson two/i }));

    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('sets Courses as the active sidebar tab and keeps course navigation visible', () => {
    renderSidebar();

    const coursesTab = screen.getByRole('button', { name: /courses/i });
    fireEvent.click(coursesTab);

    expect(coursesTab).toHaveAttribute('aria-expanded', 'true');
    expect(coursesTab).toHaveClass('active');
    expect(screen.getByRole('menu', { name: /courses/i })).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /foundations module/i })).toBeInTheDocument();
  });

  it('switches from Courses to Tools as the active sidebar tab', () => {
    renderSidebar();

    const coursesTab = screen.getByRole('button', { name: /courses/i });
    const toolsTab = screen.getByRole('button', { name: /tools/i });

    fireEvent.click(coursesTab);
    expect(coursesTab).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toolsTab);

    expect(coursesTab).toHaveAttribute('aria-expanded', 'false');
    expect(toolsTab).toHaveAttribute('aria-expanded', 'true');
    expect(toolsTab).toHaveClass('active');
    expect(screen.getByRole('menu', { name: /tools/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /open cheat sheets/i })).toBeInTheDocument();
  });

  it('keeps first-session tools focused before a lesson is completed', () => {
    renderSidebar({ hasCompletedProgress: false });

    fireEvent.click(screen.getByRole('button', { name: /tools/i }));

    expect(screen.getByRole('menuitem', { name: /open saved lessons/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /open cheat sheets/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /open glossary/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /open badges/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /open challenges/i })).not.toBeInTheDocument();
  });

  it('keeps tab switching and lesson navigation working together', () => {
    const onSelectLesson = vi.fn();
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]);
    renderSidebar({ onSelectLesson });

    fireEvent.click(screen.getByRole('button', { name: /tools/i }));
    fireEvent.click(screen.getByRole('button', { name: /courses/i }));
    fireEvent.click(screen.getByRole('button', { name: /lesson two/i }));

    expect(screen.getByRole('button', { name: /courses/i })).toHaveAttribute('aria-expanded', 'true');
    expect(onSelectLesson).toHaveBeenCalledWith(0, 1);
  });

  it('keeps hidden chrome from intercepting sidebar tab clicks', () => {
    const hiddenToolbar = document.createElement('div');
    hiddenToolbar.className = 'bottom-tools';
    hiddenToolbar.style.pointerEvents = 'none';
    document.body.appendChild(hiddenToolbar);
    renderSidebar();

    const toolsTab = screen.getByRole('button', { name: /tools/i });
    fireEvent.click(toolsTab);

    expect(toolsTab).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: /tools/i })).toBeInTheDocument();
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

  it('keeps the closed mobile drawer hidden and removed from tab order', () => {
    renderSidebar({ isMobile: true, isOpen: false });

    const shell = document.querySelector('.sidebar-shell');
    const nav = document.getElementById('course-sidebar');
    const firstButton = nav.querySelector('button');

    expect(shell).toHaveAttribute('aria-hidden', 'true');
    expect(shell).toHaveAttribute('inert');
    expect(nav).toHaveAttribute('aria-hidden', 'true');
    expect(nav).toHaveAttribute('inert');
    expect(firstButton).toHaveAttribute('tabindex', '-1');
  });

  it('mobileSidebarSupportsKeyboardNavigation', () => {
    const onClose = vi.fn();
    renderSidebar({ isMobile: true, isOpen: true, onClose });

    expect(mockUseFocusTrap).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        enabled: true,
        onEscape: onClose,
        lockBodyScroll: true,
        initialFocus: 'first-tabbable',
      }),
    );
  });

  it('opens Tools popout and triggers selected tool', () => {
    const onOpenTool = vi.fn();
    renderSidebar({ onOpenTool });

    fireEvent.click(screen.getByRole('button', { name: /tools/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /cheat sheets/i }));

    expect(onOpenTool).toHaveBeenCalledWith('cheatsheet');
  });

  it('closes the mobile drawer after selecting a tool', () => {
    const onOpenTool = vi.fn();
    const onClose = vi.fn();
    renderSidebar({ isMobile: true, isOpen: true, onOpenTool, onClose });

    fireEvent.click(screen.getByRole('button', { name: /tools/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /cheat sheets/i }));

    expect(onOpenTool).toHaveBeenCalledWith('cheatsheet');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes the mobile drawer after selecting a course', () => {
    const onSelectCourse = vi.fn();
    const onClose = vi.fn();
    renderSidebar({ isMobile: true, isOpen: true, onSelectCourse, onClose });

    fireEvent.click(screen.getByRole('button', { name: /courses/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /switch to html course/i }));

    expect(onSelectCourse).toHaveBeenCalledWith(0);
    expect(onClose).toHaveBeenCalled();
  });

  it('marks desktop-collapsed sidebar as hidden and inert', () => {
    renderSidebar({ isCollapsed: true, isMobile: false });

    const nav = document.getElementById('course-sidebar');
    expect(nav).not.toBeNull();
    expect(nav).toHaveAttribute('aria-hidden', 'true');
    expect(nav).toHaveAttribute('inert');
  });

  it('supports keyboard navigation for menu-style tools popout', async () => {
    renderSidebar();
    const toolsTab = screen.getByRole('button', { name: /tools/i });

    toolsTab.focus();
    fireEvent.keyDown(toolsTab, { key: 'ArrowDown' });

    const menu = await screen.findByRole('menu');
    const firstItem = await screen.findByRole('menuitem', { name: /open saved lessons/i });
    const lastItem = await screen.findByRole('menuitem', { name: /open badges/i });

    await waitFor(() => expect(firstItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'End' });
    await waitFor(() => expect(lastItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'Home' });
    await waitFor(() => expect(firstItem).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(toolsTab).toHaveFocus());
  });
});
