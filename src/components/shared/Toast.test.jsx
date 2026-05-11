import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function ToastHarness() {
  const toast = useToast();

  return (
    <>
      <button type="button" onClick={() => toast.show('First saved', 1000)}>
        show first
      </button>
      <button type="button" onClick={() => toast.show('Second saved', 1000)}>
        show second
      </button>
      <button
        type="button"
        onClick={() => toast.show('Could not save', { duration: 1000, tone: 'error' })}
      >
        show error
      </button>
    </>
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the newest toast visible when messages are shown quickly', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'show first' }));
    expect(screen.getByRole('status')).toHaveTextContent('First saved');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByRole('button', { name: 'show second' }));
    expect(screen.getByRole('status')).toHaveTextContent('Second saved');

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Second saved');
    expect(screen.getByRole('status')).toHaveClass('toast-in');

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces error toasts assertively without changing the success toast contract', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'show error' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not save');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveClass('toast-error');

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'show first' }));
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
