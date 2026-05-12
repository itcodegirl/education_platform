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
    hasRewardBeenAwarded = () => false,
    markRewardAwarded = () => false,
    awardXP = () => {},
    xpAmount = 0,
    reason = '',
  }) => {
    if (hasRewardBeenAwarded(legacyRewardKey)) {
      return {
        rewardResult: {
          xpAwarded: 0,
        },
      };
    }

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

    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(saveQuizScore).toHaveBeenCalledWith('html-foundations-quiz', '1/1');
      expect(
        screen.getByText(/Best score saved to your progress/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/XP is awarded once per quiz milestone/i)).toBeInTheDocument();
    });
  });

  it('does not overwrite a better saved score with a lower retry score', async () => {
    const saveQuizScore = vi.fn();
    mockUseProgressData.mockReturnValue({
      quizScores: { 'html-foundations-quiz': '1/1' },
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

    fireEvent.click(screen.getByRole('radio', { name: /<p>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/Best score saved to your progress/i)).toBeInTheDocument();
    });
    expect(saveQuizScore).not.toHaveBeenCalled();
  });

  it('quizRetryDoesNotDuplicateXp when only legacy quiz rewards exist', async () => {
    const awardXP = vi.fn();
    const saveQuizScore = vi.fn();
    const legacyBaseRewardKey = rewardKeys.quizComplete('l:h1-1');
    const legacyPerfectRewardKey = rewardKeys.quizPerfect('l:h1-1');
    const hasRewardBeenAwarded = vi.fn((rewardKey) =>
      rewardKey === legacyBaseRewardKey || rewardKey === legacyPerfectRewardKey,
    );
    const markRewardAwarded = vi.fn(() => true);

    mockUseProgressData.mockReturnValue({
      quizScores: { 'l:h1-1': '1/1' },
      saveQuizScore,
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
        label="Quick Check"
        quizKey="l:html:h1-1"
        legacyQuizKeys={['l:h1-1']}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/XP already earned/i)).toBeInTheDocument();
    });
    expect(saveQuizScore).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
    expect(markRewardAwarded).not.toHaveBeenCalled();
    expect(hasRewardBeenAwarded).toHaveBeenCalledWith(legacyBaseRewardKey);
    expect(hasRewardBeenAwarded).toHaveBeenCalledWith(legacyPerfectRewardKey);
  });

  it('quizChoicesExposeAccessibleSingleAnswerSemantics', async () => {
    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Module Quiz"
        quizKey="html-foundations-quiz"
      />,
    );

    expect(screen.getByText(/separately from lesson completion/i)).toBeInTheDocument();

    expect(screen.getByRole('group', { name: /which tag creates a top-level heading/i })).toBeInTheDocument();
    const wrongAnswer = screen.getByRole('radio', { name: /B: <p>/i });
    fireEvent.click(wrongAnswer);
    expect(wrongAnswer).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /A: <h1>, correct answer/i })).toBeDisabled();
      expect(
        screen.getByRole('radio', { name: /B: <p>, selected, incorrect answer/i }),
      ).toBeDisabled();
    });
  });

  it('shows an actionable feedback loop after a missed quiz question', async () => {
    const addToSRQueue = vi.fn();
    mockUseSR.mockReturnValue({ addToSRQueue });

    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Quick Check"
        quizKey="l:html:h1-1"
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /<p>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/Feedback loop: Rebuild the basics first/i)).toBeInTheDocument();
      expect(screen.getByText(/rebuild the lesson example/i)).toBeInTheDocument();
      expect(addToSRQueue).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'l:html:h1-1:q1',
          question: 'Which tag creates a top-level heading?',
          questionId: 'q1',
          source: 'Quick Check',
          quizKey: 'l:html:h1-1',
          quizType: 'lesson',
          courseId: 'html',
          lessonId: 'h1-1',
        }),
      ]);
    });
  });

  it('bugQuizChoicesUseNativeSingleAnswerSemantics', async () => {
    const bugQuiz = {
      questions: [
        {
          id: 'bug-1',
          type: 'bug',
          question: 'Which line has the bug?',
          lines: ['const total = 1 + 1;', 'return totl;'],
          correct: 1,
          explanation: 'The return statement uses a misspelled variable name.',
        },
      ],
    };

    render(
      <QuizView
        quiz={bugQuiz}
        accent="#4ecdc4"
        label="Bug Check"
        quizKey="bug-check"
      />,
    );

    expect(screen.getByRole('group', { name: /which line has the bug/i })).toBeInTheDocument();
    const bugLine = screen.getByRole('radio', { name: /Line 2: return totl;/i });
    fireEvent.click(bugLine);
    expect(bugLine).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Line 2: return totl;, selected, correct answer/i })).toBeDisabled();
    });
  });

  it('orderQuizControlsAnnounceMovedItemAndPosition', () => {
    render(
      <QuizView
        quiz={{
          questions: [
            {
              id: 'order-1',
              type: 'order',
              question: 'Put the page layers in order.',
              items: ['HTML', 'CSS', 'JavaScript'],
              correct: [0, 1, 2],
              explanation: 'Start with structure, then styles, then behavior.',
            },
          ],
        }}
        accent="#4ecdc4"
        label="Order Check"
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Move CSS from position 2 to position 1/i,
      }),
    );

    expect(screen.getByText(/CSS moved to position 1 of 3/i)).toBeInTheDocument();
  });

  it('does not award quiz XP again on retry after both quiz rewards are earned', async () => {
    const awarded = new Set();
    const awardXP = vi.fn();
    const recordDailyActivity = vi.fn();
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
      recordDailyActivity,
    });

    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Module Quiz"
        quizKey="html-foundations-quiz"
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
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
    expect(recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('uses legacy quiz keys as aliases without awarding duplicate XP', async () => {
    const legacyQuizKey = 'l:lesson-01';
    const stableQuizKey = 'l:html:lesson-01';
    const awarded = new Set([
      rewardKeys.quizComplete(legacyQuizKey),
      rewardKeys.quizPerfect(legacyQuizKey),
    ]);
    const awardXP = vi.fn();
    const saveQuizScore = vi.fn();
    const recordDailyActivity = vi.fn();
    const hasRewardBeenAwarded = vi.fn((rewardKey) => awarded.has(rewardKey));
    const markRewardAwarded = vi.fn((rewardKey) => {
      if (awarded.has(rewardKey)) return false;
      awarded.add(rewardKey);
      return true;
    });

    mockUseProgressData.mockReturnValue({
      quizScores: { [legacyQuizKey]: '1/1' },
      saveQuizScore,
      hasRewardBeenAwarded,
      markRewardAwarded,
      markSyncFailed: vi.fn(),
    });
    mockUseXP.mockReturnValue({
      awardXP,
      recordDailyActivity,
    });

    render(
      <QuizView
        quiz={quiz}
        accent="#4ecdc4"
        label="Quick Check"
        quizKey={stableQuizKey}
        legacyQuizKeys={[legacyQuizKey]}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /A: <h1>/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/XP already earned/i)).toBeInTheDocument();
    });
    expect(saveQuizScore).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
    expect(recordDailyActivity).not.toHaveBeenCalled();
  });

  it('reward-engine.double-click-does-not-duplicate-xp for quiz submissions', async () => {
    const awarded = new Set();
    const awardXP = vi.fn();
    const markRewardAwarded = vi.fn((rewardKey) => {
      if (awarded.has(rewardKey)) return false;
      awarded.add(rewardKey);
      return true;
    });

    mockUseProgressData.mockReturnValue({
      quizScores: {},
      saveQuizScore: vi.fn(),
      hasRewardBeenAwarded: vi.fn((rewardKey) => awarded.has(rewardKey)),
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

    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
    const submitButton = screen.getByRole('button', { name: /submit answers/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(awardXP).toHaveBeenCalledTimes(2);
      expect(awardXP).toHaveBeenCalledWith(40, 'Quiz completed');
      expect(awardXP).toHaveBeenCalledWith(60, 'Perfect quiz score!');
    });
    expect(markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.quizComplete('html-foundations-quiz'),
    );
    expect(markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.quizPerfect('html-foundations-quiz'),
    );
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

    fireEvent.click(screen.getByRole('radio', { name: /<h1>/i }));
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

