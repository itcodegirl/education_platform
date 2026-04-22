import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarksPanel } from './BookmarksPanel';

const { mockUseSR, mockUseCourseContent } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
  mockUseCourseContent: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useSR: () => mockUseSR(),
  useCourseContent: () => mockUseCourseContent(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('BookmarksPanel', () => {
  const mockCourses = [{
    id: 'html',
    label: 'HTML',
    modules: [{
      id: 'basics',
      title: 'Basics',
      lessons: [{ id: 'l-what', title: 'What is HTML?' }],
    }],
  }];

  beforeEach(() => {
    mockUseSR.mockReturnValue({
      bookmarks: [],
      toggleBookmark: vi.fn(),
    });
    mockUseCourseContent.mockReturnValue({
      ensureAllLoaded: vi.fn(),
      courses: mockCourses,
    });
  });

  it('renders a helpful empty state when no bookmarks exist', () => {
    render(
      <BookmarksPanel
        isOpen
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /Bookmarks \(0\)/i })).toBeInTheDocument();
    expect(screen.getByText(/No bookmarks yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Mark a lesson as saved from the header star/i),
    ).toBeInTheDocument();
  });

  it('opens a stable-key bookmark and routes to the resolved lesson indices', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    mockUseSR.mockReturnValue({
      bookmarks: [{
        lesson_key: 'c:html|m:basics|l:l-what',
        course_id: 'html',
        lesson_title: 'What is HTML?',
      }],
      toggleBookmark: vi.fn(),
    });

    render(
      <BookmarksPanel
        isOpen
        onClose={onClose}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /open what is html/i }));
    expect(onNavigate).toHaveBeenCalledWith(0, 0, 0);
    expect(onClose).toHaveBeenCalled();
  });
});
