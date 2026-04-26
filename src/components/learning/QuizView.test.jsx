import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizView } from './QuizView';
import { awardRewardOnce } from '../../engine/rewards/rewardRuntime';
import { rewardKeys } from '../../services/rewardPolicy';

const { mockUseAuth, mockUseProgressData, mockUseXP, mockUseSR } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseProgressData: vi.fn(),
  mockUseXP: vi.fn(),
  mockUseSR: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useAuth: () => mockUseAuth(),
  useProgressData: () => mockUseProgressData(),
  useXP: () => mockUseXP(),
  useSR: () => mockUseSR(),
}));

vi.mock('../../engine/rewards/rewardRuntime', () => ({
  awardRewardOnce: vi.fn(async ({
    legacyRewardKey,
    markRewardAwarded = () => false,
    awardXP = () => {},
    xpAmount = 0,
    reason = '',
  }) => {
    const awarded = markRewardAwarded(legacyRewardKey);
    if (awarded) {
      awardXP(xpAmount, reason);
    }
    return {
      rewardResult: {
        xpAwarded: awarded ? xpAmount : 0,
      },
    };
  }),
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

let learnerCounter = 0;

describe('QuizView', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(awardRewardOnce).mockClear();
    learnerCounter += 1;
    mockUseAuth.mockReturnValue({ user: { id: `learner-${learnerCounter}` } });
    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore: vi.fn(),
      hasRewardBeenAwarded: vi.fn(() => false),
      markRewardAwarded: vi.fn(() => true),
      markSyncFailed: vi.fn(),
    });
    mockUseXP.mockReturnValue({
      awardXP: vi.fn(),
      recordDailyActivity: vi.fn(),
    });
    mockUseSR.mockReturnValue({
      addToSRQueue: vi.fn(),
    });
  });

  it('shows score-saved confirmation after submit when quizKey is present', async () => {
    const saveQuizScore = vi.fn();
    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore,
      hasRewardBeenAwarded: vi.fn(() => false),
      markRewardAwarded: vi.fn(() => true),
      markSyncFailed: vi.fn(),
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

    await waitFor(() => {
      expect(saveQuizScore).toHaveBeenCalledWith('html-foundations-quiz', '1/1');
      expect(
        screen.getByText(/Best score saved to your progress/i),
      ).toBeInTheDocument();
    });
  });

  it('does not award quiz XP again on retry after both quiz rewards are earned', async () => {
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
      markSyncFailed: vi.fn(),
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
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
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

  it('passes the backend reward sync flag into direct quiz reward calls', async () => {
    vi.stubEnv('VITE_REWARD_BACKEND_SYNC_ENABLED', 'true');

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

    await waitFor(() => {
      expect(awardRewardOnce).toHaveBeenCalledTimes(2);
    });

    expect(vi.mocked(awardRewardOnce).mock.calls[0][0]).toMatchObject({
      learnerKey: expect.stringMatching(/^learner-/),
      backendRewardSyncEnabled: true,
    });
    expect(vi.mocked(awardRewardOnce).mock.calls[1][0]).toMatchObject({
      learnerKey: expect.stringMatching(/^learner-/),
      backendRewardSyncEnabled: true,
    });
  });
});

