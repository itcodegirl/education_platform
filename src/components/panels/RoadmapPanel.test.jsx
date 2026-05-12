import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoadmapPanel } from './RoadmapPanel';

const { mockUseProgressData } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
}));
const { mockUseFocusTrap } = vi.hoisted(() => ({
  mockUseFocusTrap: vi.fn(),
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
  useFocusTrap: (...args) => mockUseFocusTrap(...args),
}));

describe('RoadmapPanel', () => {
  beforeEach(() => {
    mockUseFocusTrap.mockReset();
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

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Current');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Upcoming');
    expect(screen.getByText(/Stage 1: Structure/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence target:/i)).toHaveTextContent(/accessible structure/i);
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

    expect(screen.getByRole('button', { name: /foundations/i })).toHaveTextContent('Complete');
    expect(screen.getByRole('button', { name: /forms/i })).toHaveTextContent('Current');
    expect(screen.getByText(/Next useful step:/i)).toHaveTextContent(/lesson, quick check, review/i);
  });
});
