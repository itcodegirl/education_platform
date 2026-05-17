import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChallengesPanel } from './ChallengesPanel';

const {
  mockAreChallengesLoaded,
  mockGetChallengesForCourse,
  mockLoadChallengesForCourse,
  mockUseProgressData,
  mockUseLearning,
  mockTrackEvent,
  challengeFixture,
} = vi.hoisted(() => {
  const challengeFixture = {
    id: 'challenge-1',
    title: 'Build a Card',
    description: 'Create a reusable card.',
    difficulty: 'beginner',
    requirements: ['Use a card container', 'Render a heading'],
    rubric: ['Card layout is reusable with different content', 'Variant styling is visible without changing the component internals'],
    tests: [{ label: 'has card' }, { label: 'has heading' }],
  };

  return {
    mockAreChallengesLoaded: vi.fn(),
    mockGetChallengesForCourse: vi.fn(),
    mockLoadChallengesForCourse: vi.fn(),
    mockUseProgressData: vi.fn(),
    mockUseLearning: vi.fn(),
    mockTrackEvent: vi.fn(),
    challengeFixture,
  };
});

vi.mock('../../data/challenges', () => ({
  areChallengesLoaded: mockAreChallengesLoaded,
  getChallengesForCourse: mockGetChallengesForCourse,
  loadChallengesForCourse: mockLoadChallengesForCourse,
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

vi.mock('../../lib/analytics', () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

describe('ChallengesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAreChallengesLoaded.mockReturnValue(true);
    mockGetChallengesForCourse.mockReturnValue([challengeFixture]);
    mockLoadChallengesForCourse.mockResolvedValue([challengeFixture]);
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
    expect(screen.getAllByText(/2 requirements backed by 2 checks/i)).toHaveLength(2);
    expect(screen.getAllByText(/Use the tests as feedback/i)[0]).toBeInTheDocument();
  });

  it('opens a lesson-targeted challenge directly', async () => {
    const onInitialChallengeConsumed = vi.fn();

    render(
      <ChallengesPanel
        courseId="html"
        lang="html"
        onClose={vi.fn()}
        initialChallengeId="challenge-1"
        onInitialChallengeConsumed={onInitialChallengeConsumed}
      />,
    );

    expect(await screen.findByRole('dialog', { name: /challenge: build a card/i })).toBeInTheDocument();
    expect(onInitialChallengeConsumed).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith('challenge_workspace_opened', expect.objectContaining({
      challengeId: 'challenge-1',
      source: 'lesson-recommendation',
    }));
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
    expect(mockTrackEvent).toHaveBeenCalledWith('challenge_workspace_opened', expect.objectContaining({
      challengeId: 'challenge-1',
      courseId: 'html',
      source: 'recommendation',
      requirementCount: 2,
      testCount: 2,
    }));
    expect(mockTrackEvent).toHaveBeenCalledWith('challenge_completed', expect.objectContaining({
      challengeId: 'challenge-1',
      source: 'workspace',
    }));
  });

  it('shows challenge evidence scope inside the challenge workspace', () => {
    mockUseProgressData.mockReturnValue({ challengeCompletions: ['challenge-1'] });

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /build a card/i }));

    expect(screen.getByRole('region', { name: /challenge evidence summary/i })).toHaveTextContent('Evidence ready');
    expect(screen.getByText('2 requirements')).toBeInTheDocument();
    expect(screen.getByText('2 automated checks')).toBeInTheDocument();
    expect(screen.getByText('Definition of done')).toBeInTheDocument();
    expect(screen.getByText(/Variant styling is visible without changing the component internals/i)).toBeInTheDocument();
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
    expect(screen.getByText(/What would you improve before showing this in a portfolio/i)).toBeInTheDocument();
  });

  it('shows the local-first progress sync scope in the challenge list', () => {
    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/challenges are single-device today/i)).toBeInTheDocument();
  });

  it('lets learners retry when the lazy challenge list fails to load', async () => {
    mockAreChallengesLoaded.mockReturnValue(false);
    mockGetChallengesForCourse.mockReturnValue([]);
    mockLoadChallengesForCourse
      .mockRejectedValueOnce(new Error('Chunk load failed'))
      .mockResolvedValueOnce([challengeFixture]);

    render(<ChallengesPanel courseId="html" lang="html" onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Challenges could not load right now/i);
    expect(screen.getByText(/lesson workspace is still safe/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chunk load failed/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Loading the challenge lab/i);
    expect(await screen.findByRole('button', { name: /start recommended challenge: build a card/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
