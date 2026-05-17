import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonProjectLinks } from './LessonProjectLinks';

const {
  mockAreChallengesLoaded,
  mockGetChallengesForCourse,
  mockLoadChallengesForCourse,
} = vi.hoisted(() => ({
  mockAreChallengesLoaded: vi.fn(),
  mockGetChallengesForCourse: vi.fn(),
  mockLoadChallengesForCourse: vi.fn(),
}));

vi.mock('../../data/challenges', () => ({
  areChallengesLoaded: mockAreChallengesLoaded,
  getChallengesForCourse: mockGetChallengesForCourse,
  loadChallengesForCourse: mockLoadChallengesForCourse,
}));

describe('LessonProjectLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAreChallengesLoaded.mockReturnValue(true);
    mockLoadChallengesForCourse.mockResolvedValue([]);
  });

  it('shows the module-mapped project and opens that challenge', () => {
    const onOpenChallenge = vi.fn();
    mockGetChallengesForCourse.mockReturnValue([
      {
        id: 'react-ch-forms',
        title: 'Validated Signup Wizard',
        description: 'Build a multi-step signup flow with validation.',
        difficulty: 'intermediate',
        recommendedModuleId: '308',
        requirements: ['Validate email', 'Show errors'],
        tests: [{ label: 'checks validation' }],
      },
    ]);

    render(
      <LessonProjectLinks
        courseId="react"
        moduleId="308"
        moduleTitle="Forms & Validation"
        onOpenChallenge={onOpenChallenge}
      />,
    );

    expect(screen.getByRole('heading', { name: /turn this module into proof/i })).toBeInTheDocument();
    expect(screen.getByText(/Validated Signup Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/2 requirements \/ 1 check/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open project challenge: validated signup wizard/i }));

    expect(onOpenChallenge).toHaveBeenCalledWith('react-ch-forms');
  });

  it('loads lazy challenge data when the course catalog is not cached yet', async () => {
    mockAreChallengesLoaded.mockReturnValue(false);
    mockGetChallengesForCourse.mockReturnValue([]);
    mockLoadChallengesForCourse.mockResolvedValue([
      {
        id: 'html-ch-debug',
        title: 'Browser Language Debug Board',
        description: 'Explain how the browser reads a document.',
        recommendedModuleId: '102',
      },
    ]);

    render(
      <LessonProjectLinks
        courseId="html"
        moduleId="102"
        moduleTitle="Understand What You Built"
        onOpenChallenge={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Browser Language Debug Board/i)).toBeInTheDocument();
  });

  it('stays quiet when no project is mapped to the module', () => {
    mockGetChallengesForCourse.mockReturnValue([
      { id: 'js-ch-1', title: 'DOM Lab', recommendedModuleId: 'dom' },
    ]);

    const { container } = render(
      <LessonProjectLinks
        courseId="js"
        moduleId="awakening"
        moduleTitle="JavaScript Awakening"
        onOpenChallenge={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
