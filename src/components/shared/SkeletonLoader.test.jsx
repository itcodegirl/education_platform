/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ConnectionError,
  LessonSkeleton,
  SidebarSkeleton,
} from './SkeletonLoader';

describe('SidebarSkeleton', () => {
  it('exposes a status region with a screen-reader-only loading label', () => {
    render(<SidebarSkeleton />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent(/Loading course navigation/i);
  });
});

describe('LessonSkeleton', () => {
  it('exposes a status region announcing that the lesson is loading', () => {
    render(<LessonSkeleton />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent(/Loading lesson/i);
  });
});

describe('ConnectionError', () => {
  it('renders an alert with the recovery button and fires onRetry on click', () => {
    const onRetry = vi.fn();
    render(<ConnectionError onRetry={onRetry} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Connection issue/i);

    const retry = screen.getByRole('button', { name: /retry connection/i });
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
