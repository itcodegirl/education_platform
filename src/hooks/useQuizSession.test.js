import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const {
  mockAwardRewardOnce,
  mockIsBackendRewardSyncEnabled,
  mockCreateRewardEvent,
  mockSaveQuizScore,
  mockHasRewardBeenAwarded,
  mockMarkRewardAwarded,
  mockMarkSyncFailed,
  mockAwardXP,
  mockRecordDailyActivity,
  mockAddToSRQueue,
} = vi.hoisted(() => ({
  mockAwardRewardOnce: vi.fn(),
  mockIsBackendRewardSyncEnabled: vi.fn(() => false),
  mockCreateRewardEvent: vi.fn((args) => args),
  mockSaveQuizScore: vi.fn(),
  mockHasRewardBeenAwarded: vi.fn(() => false),
  mockMarkRewardAwarded: vi.fn(() => true),
  mockMarkSyncFailed: vi.fn(),
  mockAwardXP: vi.fn(),
  mockRecordDailyActivity: vi.fn(),
  mockAddToSRQueue: vi.fn(),
}));

vi.mock('../providers', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
  useProgressData: () => ({
    saveQuizScore: mockSaveQuizScore,
    quizScores: {},
    hasRewardBeenAwarded: mockHasRewardBeenAwarded,
    markRewardAwarded: mockMarkRewardAwarded,
    markSyncFailed: mockMarkSyncFailed,
  }),
  useXP: () => ({ awardXP: mockAwardXP, recordDailyActivity: mockRecordDailyActivity }),
  useSR: () => ({ addToSRQueue: mockAddToSRQueue }),
}));

vi.mock('../engine/rewards/rewardRuntime', () => ({
  awardRewardOnce: (...args) => mockAwardRewardOnce(...args),
}));

vi.mock('../services/rewardEventService', () => ({
  isBackendRewardSyncEnabled: () => mockIsBackendRewardSyncEnabled(),
}));

vi.mock('../engine/rewards/rewardEvents', () => ({
  createRewardEvent: (...args) => mockCreateRewardEvent(...args),
}));

import { useQuizSession } from './useQuizSession';

// ─── fixtures ────────────────────────────────────────────────
function mcQ(id, correct = 'a') {
  return { id, type: 'mc', question: `Q ${id}?`, options: ['a', 'b', 'c'], correct };
}

const QUIZ_2Q = { questions: [mcQ('q1', 'a'), mcQ('q2', 'b')] };
const QUIZ_3Q = { questions: [mcQ('q1', 'a'), mcQ('q2', 'b'), mcQ('q3', 'c')] };
const EMPTY_QUIZ = { questions: [] };

const QUIZ_KEY = 'l:html:lesson-01';

// awardRewardOnce returns { rewardResult: { xpAwarded } } by default
function resolveReward(xp = 10) {
  return Promise.resolve({ rewardResult: { xpAwarded: xp } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAwardRewardOnce.mockImplementation(() => resolveReward(10));
});

// ─── initial state ────────────────────────────────────────────
describe('initial state', () => {
  it('starts with no answers, not submitted, and zero XP', () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    expect(result.current.answers.size).toBe(0);
    expect(result.current.submitted).toBe(false);
    expect(result.current.lastEarnedXp).toBe(0);
  });

  it('derives total from quiz.questions.length', () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_3Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    expect(result.current.total).toBe(3);
  });

  it('allAnswered is false until every question has an answer', () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    expect(result.current.allAnswered).toBe(false);

    act(() => result.current.setAnswer('q1', 'a'));
    expect(result.current.allAnswered).toBe(false);

    act(() => result.current.setAnswer('q2', 'b'));
    expect(result.current.allAnswered).toBe(true);
  });
});

// ─── setAnswer ────────────────────────────────────────────────
describe('setAnswer', () => {
  it('records answers keyed by question id', () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'c');
    });
    expect(result.current.answers.get('q1')).toBe('a');
    expect(result.current.answers.get('q2')).toBe('c');
  });

  it('ignores answer updates once submitted', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    act(() => result.current.setAnswer('q1', 'c'));
    expect(result.current.answers.get('q1')).toBe('a');
  });
});

// ─── derived score values ─────────────────────────────────────
describe('derived score values', () => {
  it('score counts correct answers against the answer map', () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a'); // correct
      result.current.setAnswer('q2', 'x'); // wrong
    });
    expect(result.current.score).toBe(1);
    expect(result.current.pct).toBe(50);
  });

  it('wrongCount is 0 before submit and reflects misses after', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    expect(result.current.wrongCount).toBe(0);

    act(() => {
      result.current.setAnswer('q1', 'a'); // correct
      result.current.setAnswer('q2', 'x'); // wrong
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(result.current.wrongCount).toBe(1);
  });
});

// ─── reset ────────────────────────────────────────────────────
describe('reset', () => {
  it('clears answers, submitted flag, and lastEarnedXp', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(result.current.submitted).toBe(true);

    act(() => result.current.reset());
    expect(result.current.answers.size).toBe(0);
    expect(result.current.submitted).toBe(false);
    expect(result.current.lastEarnedXp).toBe(0);
  });
});

// ─── handleSubmit double-submission guard ─────────────────────
describe('handleSubmit double-call guard', () => {
  it('calls awardRewardOnce at most once even if handleSubmit fires twice', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => {
      await Promise.all([result.current.handleSubmit(), result.current.handleSubmit()]);
    });
    // quizComplete fires once (perfect fires too since both correct)
    // but not more than 2 total (1 complete + 1 perfect)
    expect(mockAwardRewardOnce.mock.calls.length).toBeLessThanOrEqual(2);
  });
});

// ─── handleSubmit — empty quiz bail-out ───────────────────────
describe('handleSubmit empty quiz', () => {
  it('marks submitted and earns 0 XP for an empty question list', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: EMPTY_QUIZ, label: 'Test', quizKey: QUIZ_KEY }),
    );
    await act(async () => { await result.current.handleSubmit(); });
    expect(result.current.submitted).toBe(true);
    expect(result.current.lastEarnedXp).toBe(0);
    expect(mockAwardRewardOnce).not.toHaveBeenCalled();
  });
});

// ─── handleSubmit — score saving ──────────────────────────────
describe('handleSubmit score saving', () => {
  it('saves score to quizKey when it is an improvement', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockSaveQuizScore).toHaveBeenCalledWith(QUIZ_KEY, '2/2');
  });

  it('does not save score when quizKey is absent', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: '' }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockSaveQuizScore).not.toHaveBeenCalled();
  });
});

// ─── handleSubmit — XP rewards with quizKey ───────────────────
describe('handleSubmit with quizKey', () => {
  it('awards completion XP via awardRewardOnce on a partial score', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a'); // correct
      result.current.setAnswer('q2', 'x'); // wrong
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAwardRewardOnce).toHaveBeenCalledTimes(1);
    const [call] = mockAwardRewardOnce.mock.calls;
    expect(call[0].legacyRewardKey).toContain('quiz_complete');
    expect(result.current.lastEarnedXp).toBe(10);
  });

  it('awards completion + perfect bonus when score is 100%', async () => {
    mockAwardRewardOnce
      .mockImplementationOnce(() => resolveReward(10))  // completion
      .mockImplementationOnce(() => resolveReward(15)); // perfect

    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAwardRewardOnce).toHaveBeenCalledTimes(2);
    const keys = mockAwardRewardOnce.mock.calls.map((c) => c[0].legacyRewardKey);
    expect(keys[0]).toContain('quiz_complete');
    expect(keys[1]).toContain('quiz_perfect');
    expect(result.current.lastEarnedXp).toBe(25);
  });

  it('does not fire perfect reward on a non-perfect score', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'x'); // wrong
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAwardRewardOnce).toHaveBeenCalledTimes(1);
    expect(mockAwardRewardOnce.mock.calls[0][0].legacyRewardKey).not.toContain('quiz_perfect');
  });
});

// ─── handleSubmit — no quizKey (practice) path ────────────────
describe('handleSubmit without quizKey', () => {
  it('uses awardXP directly for partial score', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Practice', quizKey: '' }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'x'); // wrong
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAwardRewardOnce).not.toHaveBeenCalled();
    expect(mockAwardXP).toHaveBeenCalledTimes(1);
    const [xp, reason] = mockAwardXP.mock.calls[0];
    expect(typeof xp).toBe('number');
    expect(reason).toContain('Quiz');
  });

  it('uses the perfect reason string when score is 100%', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Practice', quizKey: '' }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    const [, reason] = mockAwardXP.mock.calls[0];
    expect(reason).toContain('Perfect');
  });
});

// ─── handleSubmit — SR queue ──────────────────────────────────
describe('handleSubmit spaced-repetition queue', () => {
  it('queues wrong mc/code/bug answers into SR', async () => {
    const quiz = {
      questions: [
        { id: 'q1', type: 'mc', question: 'Which?', options: ['a', 'b'], correct: 'a' },
        { id: 'q2', type: 'code', question: 'Output?', lines: ['x=1'], correct: 'b' },
        { id: 'q3', type: 'mc', question: 'Last?', options: ['a', 'b'], correct: 'a' },
      ],
    };
    const { result } = renderHook(() =>
      useQuizSession({ quiz, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'x');  // wrong mc
      result.current.setAnswer('q2', 'x');  // wrong code
      result.current.setAnswer('q3', 'a');  // correct — should NOT be queued
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAddToSRQueue).toHaveBeenCalledTimes(1);
    const queued = mockAddToSRQueue.mock.calls[0][0];
    expect(queued).toHaveLength(2);
  });

  it('does not queue wrong fill/order answers (types not suited for flashcards)', async () => {
    const quiz = {
      questions: [
        { id: 'q1', type: 'fill', question: 'Type?', correct: ['answer'] },
        { id: 'q2', type: 'order', question: 'Order?', lines: ['a', 'b'], correct: ['b', 'a'] },
      ],
    };
    const { result } = renderHook(() =>
      useQuizSession({ quiz, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'wrong');
      result.current.setAnswer('q2', ['a', 'b']); // wrong order
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAddToSRQueue).not.toHaveBeenCalled();
  });

  it('skips addToSRQueue entirely when all answers are correct', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockAddToSRQueue).not.toHaveBeenCalled();
  });
});

// ─── handleSubmit — daily activity ───────────────────────────
describe('handleSubmit daily activity', () => {
  it('records daily activity when XP is earned', async () => {
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockRecordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('does not record daily activity when no XP is earned', async () => {
    mockAwardRewardOnce.mockResolvedValue({ rewardResult: { xpAwarded: 0 } });
    const { result } = renderHook(() =>
      useQuizSession({ quiz: QUIZ_2Q, label: 'Test', quizKey: QUIZ_KEY }),
    );
    act(() => {
      result.current.setAnswer('q1', 'a');
      result.current.setAnswer('q2', 'b');
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(mockRecordDailyActivity).not.toHaveBeenCalled();
  });
});
