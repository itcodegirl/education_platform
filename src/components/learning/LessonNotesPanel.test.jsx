import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LessonNotesPanel } from './LessonNotesPanel';

const { mockUseSR, mockSaveNote, mockGetNote } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
  mockSaveNote: vi.fn(),
  mockGetNote: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useSR: () => mockUseSR(),
}));

describe('LessonNotesPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveNote.mockReset();
    mockGetNote.mockReset();
    mockGetNote.mockImplementation((lessonKey) => (
      lessonKey === 'c:html|m:basics|l:intro' ? 'Existing note' : ''
    ));
    mockUseSR.mockReturnValue({
      saveNote: mockSaveNote,
      getNote: mockGetNote,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the saved note in an accessible textarea', () => {
    render(<LessonNotesPanel lessonKey="c:html|m:basics|l:intro" />);

    const textarea = screen.getByRole('textbox', { name: /lesson notes/i });
    expect(textarea).toHaveValue('Existing note');
    expect(textarea).toHaveAttribute('maxlength', '2000');
    expect(textarea).toHaveAccessibleDescription(/saved in this browser first/i);
    expect(screen.getByText(/saved locally/i)).toBeInTheDocument();
    expect(screen.getByText('13/2000')).toBeInTheDocument();
  });

  it('scrolls the textarea into view on focus so the mobile keyboard does not cover it', () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<LessonNotesPanel lessonKey="c:html|m:basics|l:intro" />);
      const textarea = screen.getByRole('textbox', { name: /lesson notes/i });
      fireEvent.focus(textarea);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: 'center' }),
      );
    } finally {
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('debounces note persistence while the learner types', () => {
    render(<LessonNotesPanel lessonKey="c:html|m:basics|l:intro" />);

    const textarea = screen.getByRole('textbox', { name: /lesson notes/i });
    fireEvent.change(textarea, { target: { value: 'Updated accessibility note' } });

    expect(textarea).toHaveValue('Updated accessibility note');
    expect(screen.getByText(/saving note/i)).toBeInTheDocument();
    expect(screen.getByText('26/2000')).toBeInTheDocument();
    expect(mockSaveNote).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(mockSaveNote).toHaveBeenCalledWith(
      'c:html|m:basics|l:intro',
      'Updated accessibility note',
    );
  });
});
