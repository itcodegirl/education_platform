import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchPanel } from './SearchPanel';

const { mockLoadSearchIndex, mockGetCachedSearchIndex } = vi.hoisted(() => ({
  mockLoadSearchIndex: vi.fn(),
  mockGetCachedSearchIndex: vi.fn(),
}));

vi.mock('../../data/reference/search-index', () => ({
  loadSearchIndex: (...args) => mockLoadSearchIndex(...args),
  getCachedSearchIndex: (...args) => mockGetCachedSearchIndex(...args),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('SearchPanel', () => {
  const sampleIndex = [
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
  ];

  beforeEach(() => {
    mockGetCachedSearchIndex.mockReturnValue([]);
    mockLoadSearchIndex.mockResolvedValue(sampleIndex);
  });

  it('loads the lightweight search manifest when the panel opens', async () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(mockLoadSearchIndex).toHaveBeenCalledTimes(1);
    });
  });

  it('shows starter guidance before the query reaches two characters', () => {
    mockGetCachedSearchIndex.mockReturnValue(sampleIndex);

    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    expect(
      screen.getByText(/Search all lessons/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Type at least two letters from a lesson/i)).toBeInTheDocument();
  });

  it('shows a clear no-results message when query has no matches', async () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(mockLoadSearchIndex).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByRole('searchbox', { name: /Search lessons/i }), {
      target: { value: 'zzz' },
    });

    expect(
      screen.getByText(/No results for/i, { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^clear search$/i })).toBeInTheDocument();
  });

  it('opens the top search result from the keyboard', async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<SearchPanel isOpen onClose={onClose} onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(mockLoadSearchIndex).toHaveBeenCalled();
    });

    const input = screen.getByRole('searchbox', { name: /Search lessons/i });
    fireEvent.change(input, {
      target: { value: 'flexbox' },
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).toHaveBeenCalledWith(1, 0, 2);
    expect(onClose).toHaveBeenCalled();
  });


  it('uses mobile-friendly search input controls', async () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(mockLoadSearchIndex).toHaveBeenCalled();
    });

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

  it('announces keyboard result selection without combobox option roles', async () => {
    render(<SearchPanel isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(mockLoadSearchIndex).toHaveBeenCalled();
    });

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
