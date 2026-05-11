/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonPagination } from './LessonPagination';

describe('LessonPagination', () => {
  it('disables Previous on the first lesson and Next on the last lesson', () => {
    const { rerender } = render(
      <LessonPagination
        onPrev={() => {}}
        onNext={() => {}}
        prevTitle=""
        nextTitle="Next lesson"
        isFirst
        isLast={false}
      />,
    );

    expect(screen.getByRole('button', { name: /previous lesson/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next lesson/i })).toBeEnabled();

    rerender(
      <LessonPagination
        onPrev={() => {}}
        onNext={() => {}}
        prevTitle="Earlier lesson"
        nextTitle=""
        isFirst={false}
        isLast
      />,
    );

    expect(screen.getByRole('button', { name: /previous lesson: earlier lesson/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /course complete/i })).toBeDisabled();
    expect(screen.getByText(/track complete/i)).toBeInTheDocument();
  });

  it('renders next-lesson title and aria-label when supplied', () => {
    render(
      <LessonPagination
        onPrev={() => {}}
        onNext={() => {}}
        prevTitle="Previous lesson title"
        nextTitle="Next lesson title"
        isFirst={false}
        isLast={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Next: Next lesson title' })).toBeInTheDocument();
    expect(screen.getByText('Next lesson title')).toBeInTheDocument();
  });

  it('invokes onPrev / onNext when the buttons are clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <LessonPagination
        onPrev={onPrev}
        onNext={onNext}
        prevTitle="Earlier"
        nextTitle="Later"
        isFirst={false}
        isLast={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /previous lesson: earlier/i }));
    fireEvent.click(screen.getByRole('button', { name: /next: later/i }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('applies the course accent color to the next button background', () => {
    render(
      <LessonPagination
        onPrev={() => {}}
        onNext={() => {}}
        prevTitle="A"
        nextTitle="B"
        isFirst={false}
        isLast={false}
        accent="#00aaff"
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /next: b/i });
    expect(nextBtn.style.background).toBe('rgb(0, 170, 255)');
  });
});
