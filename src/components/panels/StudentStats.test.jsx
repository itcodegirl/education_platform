/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const { mockUseProgressData, mockUseXP, mockUseSR } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseXP: vi.fn(),
  mockUseSR: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useXP: () => mockUseXP(),
  useSR: () => mockUseSR(),
  BADGE_DEFS: [],
}));

vi.mock('../../data/reference/course-catalog', () => ({
  COURSE_CATALOG: [
    {
      id: 'html',
      label: 'HTML',
      icon: 'H',
      accent: '#000',
      modules: [{ id: 'm1', title: 'M1', lessons: [{ id: 'l1', title: 'L1' }] }],
    },
    {
      id: 'css',
      label: 'CSS',
      icon: 'C',
      accent: '#123',
      modules: [{ id: 'c-m1', title: 'Selectors', lessons: [{ id: 'c-l1', title: 'Class selectors' }] }],
    },
  ],
}));

vi.mock('../../data/challenges', () => ({
  areChallengesLoaded: () => true,
  getChallengesForCourse: (courseId) => {
    if (courseId === 'html') return [{ id: 'html-challenge-1', title: 'HTML Challenge' }];
    if (courseId === 'css') return [{ id: 'css-challenge-1', title: 'CSS Challenge' }];
    return [];
  },
  loadAllChallenges: vi.fn(async () => ({
    html: [{ id: 'html-challenge-1', title: 'HTML Challenge' }],
    css: [{ id: 'css-challenge-1', title: 'CSS Challenge' }],
  })),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

import { StudentStats } from './StudentStats';

beforeEach(() => {
  mockUseProgressData.mockReturnValue({ completed: [], quizScores: {}, challengeCompletions: [] });
  mockUseSR.mockReturnValue({ srCards: [], bookmarks: [], notes: {} });
});

describe('StudentStats streak card', () => {
  it('exposes progress as a modal dialog with an accessible close path', () => {
    const onClose = vi.fn();
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={onClose} />);

    const dialog = screen.getByRole('dialog', { name: /your progress/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: /close progress panel/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to current lesson/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the active-streak card when streak is alive', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 200,
      streak: 5,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    const label = screen.getByText('Learning streak');
    const card = label.parentElement;
    expect(card).toHaveTextContent('5');
    expect(card).toHaveTextContent(/steady rhythm is forming/i);
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
    expect(card).toHaveTextContent(/one lesson today resumes it/i);
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

    const label = screen.getByText('Learning streak');
    const card = label.parentElement;
    expect(card).toHaveTextContent('0');
    expect(card).not.toHaveTextContent(/streak paused/i);
  });

  it('uses a clear first-lesson empty state before progress exists', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/No completed lessons yet/i)).toBeInTheDocument();
    expect(screen.getByText(/use Complete lesson to start your progress dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to current lesson/i })).toBeInTheDocument();
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

  it('keeps the detailed breakdown collapsed until a brand-new learner opts in', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Mastery Evidence')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show full breakdown/i }));
    expect(screen.getByText('Mastery Evidence')).toBeInTheDocument();
  });

  it('shows the detailed breakdown immediately once a lesson is complete', () => {
    mockUseProgressData.mockReturnValue({ completed: ['c:html|m:m1|l:l1'], quizScores: {} });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Mastery Evidence')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show full breakdown/i })).not.toBeInTheDocument();
  });

  it('labels progress completion as lesson completion', () => {
    mockUseProgressData.mockReturnValue({ completed: ['c:html|m:m1|l:l1'], quizScores: {} });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Lessons complete')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /recommended next step/i })).toHaveTextContent(/continue the next lesson/i);
  });

  it('prioritizes due review work in the recommended next step', () => {
    mockUseProgressData.mockReturnValue({ completed: ['c:html|m:m1|l:l1'], quizScores: {} });
    mockUseSR.mockReturnValue({
      srCards: [{ id: 'card-1', nextReview: 0 }],
      bookmarks: [],
      notes: {},
    });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('region', { name: /recommended next step/i })).toHaveTextContent(/review what is due/i);
  });

  it('matches quiz averages by stable lesson and module ids', () => {
    mockUseProgressData.mockReturnValue({
      completed: ['c:html|m:m1|l:l1'],
      quizScores: {
        'l:l1': '1/1',
        'm:m1': '1/2',
        'l:c-l1': '0/1',
        'l:unknown': '0/1',
        'm:m1-bad': 'not-a-score',
      },
      challengeCompletions: [],
    });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Quiz avg: 75%')).toBeInTheDocument();
    expect(screen.getByText('Quiz avg: 0%')).toBeInTheDocument();
  });

  it('shows mastery evidence separately from motivational XP', () => {
    mockUseProgressData.mockReturnValue({
      completed: ['c:html|m:m1|l:l1'],
      quizScores: {
        'l:html:l1': '1/1',
      },
      challengeCompletions: ['html-challenge-1'],
    });
    mockUseSR.mockReturnValue({
      srCards: [{ nextReview: 0 }],
      bookmarks: [],
      notes: {},
    });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Mastery Evidence')).toBeInTheDocument();
    expect(screen.getByText(/Lesson completion shows exposure/i)).toBeInTheDocument();
    expect(screen.getByText('Review evidence due')).toBeInTheDocument();
    expect(screen.getByText(/retry one missed quick check/i)).toBeInTheDocument();
    expect(screen.getByText('Quiz checks at 80%+')).toBeInTheDocument();
    expect(screen.getByText('Applied challenges')).toBeInTheDocument();
    expect(screen.getByText('Review due now')).toBeInTheDocument();
    expect(screen.getByText('Challenges: 1/1')).toBeInTheDocument();
  });

  it('summarizes private transcript readiness across reading, recall, application, and review', () => {
    mockUseProgressData.mockReturnValue({
      completed: ['c:html|m:m1|l:l1'],
      quizScores: {
        'l:html:l1': '1/1',
      },
      challengeCompletions: ['html-challenge-1'],
    });
    mockUseSR.mockReturnValue({
      srCards: [],
      bookmarks: [],
      notes: {},
    });
    mockUseXP.mockReturnValue({
      xpTotal: 80,
      streak: 1,
      pausedStreak: null,
      dailyCount: 1,
      earnedBadges: {},
    });

    render(<StudentStats isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /learning transcript/i })).toBeInTheDocument();
    expect(screen.getByText('Strong learning proof')).toBeInTheDocument();
    expect(screen.getByText('Reading progress')).toBeInTheDocument();
    expect(screen.getByText('Recall checks')).toBeInTheDocument();
    expect(screen.getByText('Application proof')).toBeInTheDocument();
    expect(screen.getByText('Review health')).toBeInTheDocument();
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
  });
});
