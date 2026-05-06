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

    expect(screen.getByRole('textbox', { name: /lesson notes/i })).toHaveValue('Existing note');
  });

  it('debounces note persistence while the learner types', () => {
    render(<LessonNotesPanel lessonKey="c:html|m:basics|l:intro" />);

    const textarea = screen.getByRole('textbox', { name: /lesson notes/i });
    fireEvent.change(textarea, { target: { value: 'Updated accessibility note' } });

    expect(textarea).toHaveValue('Updated accessibility note');
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
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
