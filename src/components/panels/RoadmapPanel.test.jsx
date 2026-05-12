import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoadmapPanel } from './RoadmapPanel';

const { mockUseProgressData } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
}));

vi.mock('../../data/reference/course-catalog', () => ({
  COURSE_CATALOG: [
    {
      id: 'html',
      label: 'HTML',
      icon: 'H',
      accent: '#4ecdc4',
      modules: [
        {
          id: 'm1',
          title: 'Foundations',
          emoji: 'F',
          lessons: [{ id: 'l1', title: 'Intro' }],
        },
        {
          id: 'm2',
          title: 'Forms',
          emoji: 'Fo',
          lessons: [
            { id: 'l2', title: 'Inputs' },
            { id: 'l3', title: 'Validation' },
          ],
        },
      ],
    },
  ],
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('RoadmapPanel', () => {
  beforeEach(() => {
    mockUseProgressData.mockReturnValue({ completedSet: new Set() });
  });

  it('labels the current module and not-started modules with readiness language', () => {
    render(
      <RoadmapPanel
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        currentCourseIdx={0}
        currentModuleIdx={0}
      />,
    );

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Reading in progress');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Not started');
  });

  it('keeps complete modules distinct from the current module readiness state', () => {
    mockUseProgressData.mockReturnValue({
      completedSet: new Set(['c:html|m:m1|l:l1']),
    });

    render(
      <RoadmapPanel
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        currentCourseIdx={0}
        currentModuleIdx={1}
      />,
    );

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Ready to continue');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Reading in progress');
  });

  it('shows evidence needed when a module has partial reading progress', () => {
    mockUseProgressData.mockReturnValue({
      completedSet: new Set(['c:html|m:m2|l:l2']),
    });

    render(
      <RoadmapPanel
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        currentCourseIdx={0}
        currentModuleIdx={0}
      />,
    );

    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Evidence needed');
  });
});
