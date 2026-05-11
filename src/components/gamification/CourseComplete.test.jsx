import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseComplete, getNextRecommendedTrack } from './CourseComplete';

vi.mock('../../utils/progressSummary', () => ({
  generateProgressSummary: vi.fn(),
}));

vi.mock('../shared/Toast', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

const course = {
  id: 'html',
  label: 'HTML Foundations',
  icon: '<>',
  accent: '#ff6b9d',
};

const courses = [
  { id: 'html', label: 'HTML', icon: '🧱', accent: '#ff6b9d' },
  { id: 'css', label: 'CSS', icon: '🎨', accent: '#4ecdc4' },
  { id: 'js', label: 'JavaScript', icon: '⚡', accent: '#ffa726' },
  { id: 'react', label: 'React', icon: '⚛️', accent: '#a78bfa' },
];

describe('CourseComplete', () => {
  it('frames completion PDFs as Progress Summaries, not verified credentials', () => {
    render(
      <CourseComplete
        isOpen
        onClose={vi.fn()}
        course={course}
        displayName="Jenna"
        lessonCount={12}
      />,
    );

    expect(screen.getByText(/^Progress Summary$/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress sync: saved on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/not server-authoritative yet/i)).toBeInTheDocument();
    expect(screen.getByText(/not a verified credential/i)).toBeInTheDocument();
    expect(screen.getByText(/not a third-party certificate/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download Progress Summary/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share progress/i })).toBeInTheDocument();
  });

  it('recommends the next track from the curriculum order and invokes the handler on click', () => {
    const onClose = vi.fn();
    const onSelectNextCourse = vi.fn();

    render(
      <CourseComplete
        isOpen
        onClose={onClose}
        course={course}
        displayName="Jenna"
        lessonCount={12}
        courses={courses}
        onSelectNextCourse={onSelectNextCourse}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /Start CSS/i });
    fireEvent.click(nextBtn);
    expect(onSelectNextCourse).toHaveBeenCalledWith('css');
    expect(onClose).toHaveBeenCalled();
  });

  it('hides the recommendation when the learner finished the last track', () => {
    render(
      <CourseComplete
        isOpen
        onClose={vi.fn()}
        course={courses[3]}
        displayName="Jenna"
        lessonCount={41}
        courses={courses}
        onSelectNextCourse={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Recommended next/i)).not.toBeInTheDocument();
  });
});

describe('getNextRecommendedTrack', () => {
  it('returns the next course in curriculum order', () => {
    expect(getNextRecommendedTrack('html', courses)).toEqual(courses[1]);
    expect(getNextRecommendedTrack('css', courses)).toEqual(courses[2]);
    expect(getNextRecommendedTrack('js', courses)).toEqual(courses[3]);
  });

  it('returns null at the end of the curriculum', () => {
    expect(getNextRecommendedTrack('react', courses)).toBeNull();
  });

  it('returns null for an unknown course id or empty list', () => {
    expect(getNextRecommendedTrack('unknown', courses)).toBeNull();
    expect(getNextRecommendedTrack('html', [])).toBeNull();
    expect(getNextRecommendedTrack('html', null)).toBeNull();
  });
});
