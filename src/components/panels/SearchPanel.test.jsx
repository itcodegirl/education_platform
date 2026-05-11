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
      screen.getByText(/Search all lessons/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Type at least two letters from a lesson/i)).toBeInTheDocument();
  });

  it('shows a clear no-results message when query has no matches', () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /Search lessons/i }), {
      target: { value: 'zzz' },
    });

    expect(
      screen.getByText(/No results for/i, { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^clear search$/i })).toBeInTheDocument();
  });

  it('opens the top search result from the keyboard', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<SearchPanel isOpen onClose={onClose} onNavigate={onNavigate} />);

    const input = screen.getByRole('searchbox', { name: /Search lessons/i });
    fireEvent.change(input, {
      target: { value: 'flexbox' },
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).toHaveBeenCalledWith(1, 0, 2);
    expect(onClose).toHaveBeenCalled();
  });

  it('uses mobile-friendly search input controls', () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    const input = screen.getByRole('searchbox', { name: /Search lessons/i });
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('inputmode', 'search');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    expect(input).toHaveAttribute('autocomplete', 'off');

    fireEvent.change(input, {
      target: { value: 'flexbox' },
    });

    fireEvent.click(screen.getByRole('button', { name: /clear search query/i }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('announces keyboard result selection without combobox option roles', () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    const input = screen.getByRole('searchbox', { name: /Search lessons/i });
    fireEvent.change(input, {
      target: { value: 'flexbox' },
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(screen.getByRole('status')).toHaveTextContent(/Flexbox Basics selected/i);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Flexbox Basics/i })).toBeInTheDocument();
  });
});
