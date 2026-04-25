import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarksPanel } from './BookmarksPanel';

const { mockUseSR, mockUseProgressData, mockUseCourseContent } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
  mockUseProgressData: vi.fn(),
  mockUseCourseContent: vi.fn(),
}));
const { mockBookmarkSubmit } = vi.hoisted(() => ({
  mockBookmarkSubmit: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useSR: () => mockUseSR(),
  useProgressData: () => mockUseProgressData(),
  useCourseContent: () => mockUseCourseContent(),
}));

vi.mock('react-router-dom', () => ({
  useFetcher: () => ({ submit: mockBookmarkSubmit }),
  useLocation: () => ({ pathname: '/learn/html/basics/l-what' }),
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
    mockBookmarkSubmit.mockReset();
    mockUseSR.mockReturnValue({
      bookmarks: [],
      toggleBookmark: vi.fn(),
    });
    mockUseProgressData.mockReturnValue({
      markSyncFailed: vi.fn(),
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

  it('removes bookmark through route action mutation', () => {
    const toggleBookmark = vi.fn();
    mockUseSR.mockReturnValue({
      bookmarks: [{
        lesson_key: 'c:html|m:basics|l:l-what',
        course_id: 'html',
        lesson_title: 'What is HTML?',
      }],
      toggleBookmark,
    });

    render(
      <BookmarksPanel
        isOpen
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove bookmark for what is html/i }));
    expect(toggleBookmark).toHaveBeenCalledWith(
      'c:html|m:basics|l:l-what',
      'html',
      'What is HTML?',
      { skipRemote: true },
    );
    expect(mockBookmarkSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'toggle-bookmark',
        mode: 'remove',
      }),
      expect.objectContaining({
        method: 'post',
        action: '/learn/html/basics/l-what',
      }),
    );
  });
});
