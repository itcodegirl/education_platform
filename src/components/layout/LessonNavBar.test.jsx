import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonNavBar } from './LessonNavBar';

const baseProps = {
  onPrev: () => {},
  onNext: () => {},
  onMarkDone: () => {},
  isFirst: false,
  isLast: false,
  isLastLesson: false,
  isDone: false,
  marking: false,
  showModQuiz: false,
  hasModuleQuiz: false,
  accent: '#4ecdc4',
  lessonPosition: 'Lesson 1 of 4',
  nextTitle: 'Lesson Two',
};

describe('LessonNavBar', () => {
  it('keeps the sticky lesson actions available', () => {
    render(<LessonNavBar {...baseProps} />);

    expect(screen.getByRole('button', { name: /go to previous lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete lesson and save reading progress/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to next lesson: lesson two/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to next lesson/i })).toHaveTextContent('Continue');
  });

  it('exposes a compact mobile tools trigger when provided', () => {
    const onOpenTools = vi.fn();

    render(<LessonNavBar {...baseProps} onOpenTools={onOpenTools} toolsOpen={false} />);

    const tools = screen.getByRole('button', { name: /open learning tools/i });
    expect(tools).toHaveAttribute('aria-expanded', 'false');
    expect(tools).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(tools);
    expect(onOpenTools).toHaveBeenCalledTimes(1);
  });

  it('clarifies that completed state belongs to the lesson only', () => {
    render(<LessonNavBar {...baseProps} isDone />);

    const lessonButton = screen.getByRole('button', { name: /mark lesson reading progress as incomplete/i });
    expect(lessonButton).toHaveTextContent(/lesson saved/i);
    expect(lessonButton).not.toHaveTextContent(/^complete$/i);
  });
});
