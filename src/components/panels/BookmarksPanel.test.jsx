import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  beforeEach(() => {
    mockUseSR.mockReturnValue({
      bookmarks: [],
      toggleBookmark: vi.fn(),
    });
    mockUseCourseContent.mockReturnValue({
      ensureAllLoaded: vi.fn(),
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
});

