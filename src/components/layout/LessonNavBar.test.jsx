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
};

describe('LessonNavBar', () => {
  it('keeps the sticky lesson actions available', () => {
    render(<LessonNavBar {...baseProps} />);

    expect(screen.getByRole('button', { name: /go to previous lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark this lesson done and save progress/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to next lesson/i })).toBeInTheDocument();
  });

  it('exposes a compact mobile tools trigger when provided', () => {
    const onOpenTools = vi.fn();

    render(<LessonNavBar {...baseProps} onOpenTools={onOpenTools} toolsOpen={false} />);

    const tools = screen.getByRole('button', { name: /open learning tools/i });
    expect(tools).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(tools);
    expect(onOpenTools).toHaveBeenCalledTimes(1);
  });
});
