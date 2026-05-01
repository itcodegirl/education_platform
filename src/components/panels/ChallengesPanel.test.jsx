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

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('routes challenge completion through the learning engine', () => {
    const completeChallenge = vi.fn();
    mockUseLearning.mockReturnValue({ completeChallenge });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /build a card/i }));
    fireEvent.click(screen.getByRole('button', { name: /complete build a card/i }));

    expect(completeChallenge).toHaveBeenCalledWith('challenge-1');
  });
});
