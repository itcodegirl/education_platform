import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPanel } from './SearchPanel';

const { mockUseCourseContent, mockBuildSearchIndex } = vi.hoisted(() => ({
  mockUseCourseContent: vi.fn(),
  mockBuildSearchIndex: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useCourseContent: () => mockUseCourseContent(),
}));

vi.mock('../../data/reference/search-index', () => ({
  buildSearchIndex: (...args) => mockBuildSearchIndex(...args),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('SearchPanel', () => {
  beforeEach(() => {
    mockUseCourseContent.mockReturnValue({
      ensureAllLoaded: vi.fn(),
      loadedCourseIds: ['html'],
      allCoursesLoaded: true,
    });
    mockBuildSearchIndex.mockReturnValue([
      {
        title: 'Flexbox Basics',
        module: 'Layout',
        course: 'CSS',
        keywords: 'flexbox gap justify align',
        icon: 'C',
        courseIdx: 1,
        modIdx: 0,
        lesIdx: 2,
      },
    ]);
  });

  it('shows starter guidance before the query reaches two characters', () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    expect(
      screen.getByText(/Start with at least two characters\./i),
    ).toBeInTheDocument();
  });

  it('shows a clear no-results message when query has no matches', () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: /Search lessons/i }), {
      target: { value: 'zzz' },
    });

    expect(
      screen.getByText(/No matches for "zzz"/i),
    ).toBeInTheDocument();
  });
});
