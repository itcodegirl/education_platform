import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoadmapPanel } from './RoadmapPanel';

const { mockUseProgressData, mockUseCourseContent } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseCourseContent: vi.fn(),
}));

vi.mock('../../data', () => ({
  COURSES: [
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
          lessons: [{ id: 'l2', title: 'Inputs' }],
        },
      ],
    },
  ],
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useCourseContent: () => mockUseCourseContent(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('RoadmapPanel', () => {
  beforeEach(() => {
    mockUseProgressData.mockReturnValue({ completedSet: new Set() });
    mockUseCourseContent.mockReturnValue({
      ensureAllLoaded: vi.fn(),
      allCoursesLoaded: true,
    });
  });

  it('labels the current module and upcoming modules', () => {
    render(
      <RoadmapPanel
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        currentCourseIdx={0}
        currentModuleIdx={0}
      />,
    );

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Current');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Upcoming');
  });

  it('keeps complete modules distinct from the current module', () => {
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

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Complete');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Current');
  });
});
