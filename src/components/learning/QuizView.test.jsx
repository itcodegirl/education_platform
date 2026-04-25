import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizView } from './QuizView';
import { rewardKeys } from '../../services/rewardPolicy';

const { mockUseProgressData, mockUseXP, mockUseSR } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseXP: vi.fn(),
  mockUseSR: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useXP: () => mockUseXP(),
  useSR: () => mockUseSR(),
}));

const quiz = {
  questions: [
    {
      id: 'q1',
      type: 'mc',
      question: 'Which tag creates a top-level heading?',
      options: ['<h1>', '<p>'],
      correct: 0,
      explanation: 'h1 is the top-level heading.',
    },
  ],
};

describe('QuizView', () => {
  beforeEach(() => {
    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore: vi.fn(),
      hasRewardBeenAwarded: vi.fn(() => false),
      markRewardAwarded: vi.fn(() => true),
    });
    mockUseXP.mockReturnValue({
      awardXP: vi.fn(),
      recordDailyActivity: vi.fn(),
    });
    mockUseSR.mockReturnValue({
      addToSRQueue: vi.fn(),
    });
  });

  it('shows score-saved confirmation after submit when quizKey is present', () => {
    const saveQuizScore = vi.fn();
    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore,
      hasRewardBeenAwarded: vi.fn(() => false),
      markRewardAwarded: vi.fn(() => true),
    });

    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Module Quiz"
        quizKey="html-foundations-quiz"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    expect(saveQuizScore).toHaveBeenCalledWith('html-foundations-quiz', '1/1');
    expect(
      screen.getByText(/Best score saved to your progress/i),
    ).toBeInTheDocument();
  });

  it('does not award quiz XP again on retry after both quiz rewards are earned', () => {
    const awarded = new Set();
    const awardXP = vi.fn();
    const hasRewardBeenAwarded = vi.fn((rewardKey) => awarded.has(rewardKey));
    const markRewardAwarded = vi.fn((rewardKey) => {
      if (awarded.has(rewardKey)) return false;
      awarded.add(rewardKey);
      return true;
    });

    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore: vi.fn(),
      hasRewardBeenAwarded,
      markRewardAwarded,
    });
    mockUseXP.mockReturnValue({
      awardXP,
      recordDailyActivity: vi.fn(),
    });

    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Module Quiz"
        quizKey="html-foundations-quiz"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    expect(awardXP).toHaveBeenCalledTimes(2);
    expect(awardXP).toHaveBeenCalledWith(40, 'Quiz completed');
    expect(awardXP).toHaveBeenCalledWith(60, 'Perfect quiz score!');
    expect(markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.quizComplete('html-foundations-quiz'),
    );
    expect(markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.quizPerfect('html-foundations-quiz'),
    );
    expect(screen.getByText(/XP already earned/i)).toBeInTheDocument();
  });
});

