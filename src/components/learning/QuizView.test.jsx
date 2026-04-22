import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizView } from './QuizView';

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
      saveQuizScore: vi.fn(),
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
      saveQuizScore,
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
      screen.getByText(/Score saved to your progress/i),
    ).toBeInTheDocument();
  });
});

