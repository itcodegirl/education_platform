/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonShellTopbar } from './LessonShellTopbar';

vi.mock('./Breadcrumb', () => ({
  Breadcrumb: ({ lesTitle }) => <div data-testid="breadcrumb">{lesTitle}</div>,
}));

vi.mock('./TopbarLearnerStatus', () => ({
  TopbarLearnerStatus: ({ learnerName }) => (
    <div data-testid="status">{learnerName ? `name:${learnerName}` : 'no-name'}</div>
  ),
}));

const baseProps = {
  isMobile: false,
  sidebarCollapsed: false,
  isSidebarOpen: true,
  onHamburgerClick: () => {},
  course: { id: 'html', label: 'HTML', icon: '🧱' },
  mod: { title: 'Module 1', emoji: '🧱' },
  les: { title: 'First lesson' },
  showModQuiz: false,
  lessonPosition: 'Lesson 1 of 3',
  learnerName: 'Sara',
  readTime: '5 min',
  xpTotal: 100,
  level: 2,
  coursePct: 25,
  streak: 3,
  pausedStreak: null,
  dailyCount: 1,
  isSearchActive: false,
  onToggleSearch: () => {},
  isDone: false,
  marking: false,
  onMarkDone: () => {},
  markDoneAriaLabel: 'Mark this lesson done',
  markDoneLabel: 'Mark done',
};

describe('LessonShellTopbar', () => {
  it('shows the desktop hamburger label and collapses on click when not mobile', () => {
    const onHamburger = vi.fn();
    render(<LessonShellTopbar {...baseProps} onHamburgerClick={onHamburger} />);

    const ham = screen.getByRole('button', { name: /collapse course navigation/i });
    expect(ham).toHaveAttribute('aria-expanded', 'true');
    expect(ham).toHaveTextContent(/collapse/i);
    fireEvent.click(ham);
    expect(onHamburger).toHaveBeenCalledTimes(1);
  });

  it('switches to the mobile menu label and reflects sidebar-open state', () => {
    render(
      <LessonShellTopbar
        {...baseProps}
        isMobile
        isSidebarOpen={false}
        sidebarCollapsed={false}
      />,
    );

    const ham = screen.getByRole('button', { name: /open course navigation/i });
    expect(ham).toHaveAttribute('aria-expanded', 'false');
    expect(ham).toHaveTextContent(/menu/i);
  });

  it('hides the mark-done button when showModQuiz is true', () => {
    render(<LessonShellTopbar {...baseProps} showModQuiz />);
    expect(screen.queryByRole('button', { name: baseProps.markDoneAriaLabel })).not.toBeInTheDocument();
  });

  it('marks the search trigger as pressed when isSearchActive is true', () => {
    const onToggleSearch = vi.fn();
    render(<LessonShellTopbar {...baseProps} isSearchActive onToggleSearch={onToggleSearch} />);

    const search = screen.getByRole('button', { name: /open lesson search/i });
    expect(search).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(search);
    expect(onToggleSearch).toHaveBeenCalledTimes(1);
  });

  it('marks the lesson-done button pressed and shows a check when isDone', () => {
    render(<LessonShellTopbar {...baseProps} isDone />);

    const markBtn = screen.getByRole('button', { name: baseProps.markDoneAriaLabel });
    expect(markBtn).toHaveAttribute('aria-pressed', 'true');
    expect(markBtn).toHaveTextContent('✓');
  });

  it('disables the mark-done button while marking is in flight', () => {
    render(<LessonShellTopbar {...baseProps} marking />);

    const markBtn = screen.getByRole('button', { name: baseProps.markDoneAriaLabel });
    expect(markBtn).toBeDisabled();
  });
});
