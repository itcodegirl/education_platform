import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChallengesPanel } from './ChallengesPanel';

const { mockUseProgressData, mockUseLearning } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseLearning: vi.fn(),
}));

vi.mock('../../data/challenges', () => ({
  getChallengesForCourse: () => [
    {
      id: 'challenge-1',
      title: 'Build a Card',
      description: 'Create a reusable card.',
      difficulty: 'beginner',
      requirements: ['Use a card container', 'Render a heading'],
      tests: [{ label: 'has card' }, { label: 'has heading' }],
    },
  ],
}));

vi.mock('../../data', () => ({
  COURSES: [
    {
      id: 'html',
      label: 'HTML',
      modules: [
        {
          id: 'foundations',
          title: 'HTML Foundations',
          lessons: [{ id: 'l1', title: 'Intro' }],
        },
      ],
    },
  ],
}));

vi.mock('../learning/CodeChallenge', () => ({
  CodeChallenge: ({ challenge, onComplete }) => (
    <button type="button" onClick={onComplete}>
      Complete {challenge.title}
    </button>
  ),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
}));

vi.mock('../../hooks/useLearning', () => ({
  useLearning: () => mockUseLearning(),
}));

describe('ChallengesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgressData.mockReturnValue({ challengeCompletions: [] });
    mockUseLearning.mockReturnValue({ completeChallenge: vi.fn() });
  });

  it('shows persisted challenge completion status', () => {
    mockUseProgressData.mockReturnValue({ challengeCompletions: ['challenge-1'] });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText('Completed here')).toBeInTheDocument();
  });

  it('reassures learners when no challenges have been completed yet', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/No completed challenges yet/i)).toBeInTheDocument();
    expect(screen.getByText(/same-browser CodeHerWay progress/i)).toBeInTheDocument();
  });

  it('shows a course-connected recommended practice match', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/Practice match/i)).toBeInTheDocument();
    expect(screen.getByText(/Best connected to/i)).toHaveTextContent('HTML Foundations');
    expect(screen.getByText(/Ready for practice: HTML Foundations/i)).toBeInTheDocument();
  });

  it('routes challenge completion through the learning engine', () => {
    const completeChallenge = vi.fn();
    mockUseLearning.mockReturnValue({ completeChallenge });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start recommended challenge: build a card/i }),
    );
    expect(screen.getByText(/not external verification/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /complete build a card/i }));

    expect(completeChallenge).toHaveBeenCalledWith('challenge-1');
  });

  it('shows challenge evidence scope inside the challenge workspace', () => {
    mockUseProgressData.mockReturnValue({ challengeCompletions: ['challenge-1'] });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /build a card/i }));

    expect(screen.getByRole('region', { name: /challenge evidence summary/i })).toHaveTextContent('Evidence ready');
    expect(screen.getByText('2 requirements')).toBeInTheDocument();
    expect(screen.getByText('2 automated checks')).toBeInTheDocument();
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
    expect(screen.getByText(/What would you improve before showing this in a portfolio/i)).toBeInTheDocument();
  });

  it('shows the local-first progress sync scope in the challenge list', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/challenges are single-device today/i)).toBeInTheDocument();
  });
});
