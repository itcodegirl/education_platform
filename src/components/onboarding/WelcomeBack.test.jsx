/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseXP } = vi.hoisted(() => ({
  mockUseXP: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useXP: () => mockUseXP(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

import { WelcomeBack } from './WelcomeBack';

const baseProps = {
  isOpen: true,
  onClose: () => {},
  onResume: () => {},
  displayName: 'Ada',
  lastPosition: { course: 'HTML', mod: 'Basics', les: 'Document structure', time: Date.now() },
  completedCount: 4,
  moduleTitle: 'Basics',
  moduleLessonsDone: 2,
  moduleLessonsTotal: 6,
  courseLabel: 'HTML',
  courseLessonsDone: 4,
  courseLessonsTotal: 12,
};

describe('WelcomeBack streak pill', () => {
  beforeEach(() => {
    mockUseXP.mockReset();
  });

  it('shows the active-streak pill when streak is alive', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 200,
      streak: 5,
      pausedStreak: null,
      dailyCount: 1,
    });

    render(<WelcomeBack {...baseProps} />);

    expect(screen.getByText(/5 day streak/i)).toBeInTheDocument();
    expect(screen.queryByText(/streak paused/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Start your first streak/i)).not.toBeInTheDocument();
  });

  it('shows the paused-streak recovery pill when active is 0 but a paused streak exists', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 200,
      streak: 0,
      pausedStreak: { days: 7, lastDate: '2025-01-01' },
      dailyCount: 0,
    });

    render(<WelcomeBack {...baseProps} />);

    expect(screen.getByText(/7 day streak paused/i)).toBeInTheDocument();
    expect(screen.queryByText(/Start your first streak/i)).not.toBeInTheDocument();
  });

  it('falls back to the first-streak invite when there is no streak history at all', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
    });

    render(<WelcomeBack {...baseProps} />);

    expect(screen.getByText(/Start your first streak today/i)).toBeInTheDocument();
    expect(screen.queryByText(/streak paused/i)).not.toBeInTheDocument();
  });
});
