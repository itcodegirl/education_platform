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
      tests: [{ label: 'has card' }],
    },
    {
      id: 'challenge-2',
      title: 'Style a Layout',
      description: 'Create a responsive layout.',
      difficulty: 'intermediate',
      tests: [{ label: 'uses grid' }, { label: 'has gap' }],
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

  it('surfaces a recommended next challenge with progress context', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/Recommended next challenge/i)).toBeInTheDocument();
    expect(screen.getByText('0/2 complete')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /start recommended challenge: build a card/i }),
    );

    expect(screen.getByRole('dialog', { name: /challenge: build a card/i })).toBeInTheDocument();
  });

  it('recommends the next open challenge after a completion', () => {
    mockUseProgressData.mockReturnValue({ challengeCompletions: ['challenge-1'] });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText('1/2 complete')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start recommended challenge: style a layout/i }),
    ).toBeInTheDocument();
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

  it('shows the local-first progress sync scope in the challenge list', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/challenges are single-device today/i)).toBeInTheDocument();
  });
});
