/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseProgressData, mockUseXP, mockUseSR, mockUseCourseContent } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseXP: vi.fn(),
  mockUseSR: vi.fn(),
  mockUseCourseContent: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useXP: () => mockUseXP(),
  useSR: () => mockUseSR(),
  useCourseContent: () => mockUseCourseContent(),
  BADGE_DEFS: [],
}));

vi.mock('../../data', () => ({
  COURSES: [
    {
      id: 'html',
      label: 'HTML',
      icon: 'H',
      accent: '#000',
      modules: [{ id: 'm1', title: 'M1', lessons: [{ id: 'l1', title: 'L1' }] }],
    },
  ],
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

import { StudentStats } from './StudentStats';

beforeEach(() => {
  mockUseProgressData.mockReturnValue({ completed: [], quizScores: {} });
  mockUseSR.mockReturnValue({ srCards: [], bookmarks: [], notes: {} });
  mockUseCourseContent.mockReturnValue({ ensureAllLoaded: vi.fn() });
});

describe('StudentStats streak card', () => {
  it('shows the active-streak card when streak is alive', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 200,
      streak: 5,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    const label = screen.getByText('Day Streak');
    const card = label.parentElement;
    expect(card).toHaveTextContent('5');
    expect(card).toHaveTextContent(/momentum is building/i);
  });

  it('shows the paused-streak recovery copy when active is 0 but a paused streak exists', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 200,
      streak: 0,
      pausedStreak: { days: 7, lastDate: '2025-01-01' },
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    const label = screen.getByText('Streak paused');
    const card = label.parentElement;
    expect(card).toHaveTextContent('7');
    expect(card).toHaveTextContent(/pick it back up/i);
  });

  it('falls back to the bare 0 when there is no streak history at all', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    const label = screen.getByText('Day Streak');
    const card = label.parentElement;
    expect(card).toHaveTextContent('0');
    expect(card).not.toHaveTextContent(/streak paused/i);
  });

  it('shows the local-first progress sync scope', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/XP, streaks, badges, review queue, and challenges are single-device today/i)).toBeInTheDocument();
  });
});
