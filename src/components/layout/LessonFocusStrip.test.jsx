import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonFocusStrip } from './LessonFocusStrip';

const baseProps = {
  lessonPosition: 'Lesson 1 of 3',
  currentStepTitle: 'Continue learning',
  currentStepCopy: 'Read this lesson, try the build, then save progress.',
  syncStatus: {
    tone: 'synced',
    label: 'Saved',
    detail: 'Progress can sync when the cloud is reachable.',
  },
};

describe('LessonFocusStrip', () => {
  it('shows current step and sync state', () => {
    render(<LessonFocusStrip {...baseProps} />);

    expect(screen.getByRole('region', { name: /current lesson step/i })).toHaveTextContent('Continue learning');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('shows optional mastery guidance without replacing sync status', () => {
    render(
      <LessonFocusStrip
        {...baseProps}
        masteryStatus={{
          tone: 'review',
          label: 'Review loop',
          detail: 'Quick check 60%. Review the missed explanations before continuing.',
        }}
      />,
    );

    expect(screen.getByText('Review loop')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('shows a retry action when queued sync writes can be retried', () => {
    const onRetrySync = vi.fn();

    render(
      <LessonFocusStrip
        {...baseProps}
        syncStatus={{
          tone: 'queued',
          label: 'Cloud sync queued',
          detail: 'Saved locally. 1 update will retry cloud sync when you are back online.',
          actionLabel: 'Retry now',
          actionAriaLabel: 'Retry queued progress updates now',
        }}
        onRetrySync={onRetrySync}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /retry queued progress updates now/i }));

    expect(onRetrySync).toHaveBeenCalledTimes(1);
  });
});
