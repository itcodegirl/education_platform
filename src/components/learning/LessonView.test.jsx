import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonView } from './LessonView';

const { mockUseSR, mockUseLocalStorage } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
  mockUseLocalStorage: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useSR: () => mockUseSR(),
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: (...args) => mockUseLocalStorage(...args),
}));

vi.mock('./LessonHeader', () => ({
  LessonHeader: ({ onToggleNotes, onToggleBookmark }) => (
    <div>
      <button type="button" onClick={onToggleNotes}>toggle notes</button>
      <button type="button" onClick={onToggleBookmark}>toggle bookmark</button>
    </div>
  ),
}));

vi.mock('./LessonNotesPanel', () => ({
  LessonNotesPanel: ({ lessonKey }) => <div data-testid="notes">notes:{lessonKey}</div>,
}));

vi.mock('./StructuredLessonBody', () => ({
  StructuredLessonBody: () => <div data-testid="structured-body">structured</div>,
}));

vi.mock('./RichLessonBody', () => ({
  RichLessonBody: () => <div data-testid="rich-body">rich</div>,
}));

vi.mock('./LessonFeedback', () => ({
  LessonFeedback: () => <div data-testid="feedback" />,
}));

vi.mock('./AITutor', () => ({
  AITutor: () => <div data-testid="ai-tutor" />,
}));

const baseProps = {
  emoji: '⚡',
  lang: 'js',
  lessonKey: 'HTML|Foundations|Lesson One',
  courseId: 'html',
  moduleTitle: 'Foundations',
};

describe('LessonView', () => {
  beforeEach(() => {
    mockUseSR.mockReturnValue({
      toggleBookmark: vi.fn(),
      isBookmarked: () => false,
    });
    mockUseLocalStorage.mockReturnValue([{}, vi.fn()]);
  });

  it('renders structured body for structured lesson shape', () => {
    render(
      <LessonView
        {...baseProps}
        lesson={{ title: 'Lesson One', hook: 'intro', do: { code: 'console.log(1)' }, understand: {} }}
      />,
    );

    expect(screen.getByTestId('structured-body')).toBeInTheDocument();
    expect(screen.queryByTestId('rich-body')).not.toBeInTheDocument();
  });

  it('renders rich body for legacy lesson shape', () => {
    render(
      <LessonView
        {...baseProps}
        lesson={{ title: 'Lesson One', content: 'body', concepts: [], tasks: [] }}
      />,
    );

    expect(screen.getByTestId('rich-body')).toBeInTheDocument();
    expect(screen.queryByTestId('structured-body')).not.toBeInTheDocument();
  });

  it('toggles notes panel and forwards bookmark toggle with identifiers', () => {
    const toggleBookmark = vi.fn();
    mockUseSR.mockReturnValue({
      toggleBookmark,
      isBookmarked: () => false,
    });

    render(
      <LessonView
        {...baseProps}
        lesson={{ title: 'Lesson One', content: 'body', concepts: [], tasks: [] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle notes/i }));
    expect(screen.getByTestId('notes')).toHaveTextContent('notes:HTML|Foundations|Lesson One');

    fireEvent.click(screen.getByRole('button', { name: /toggle bookmark/i }));
    expect(toggleBookmark).toHaveBeenCalledWith('HTML|Foundations|Lesson One', 'html', 'Lesson One');
  });
});
