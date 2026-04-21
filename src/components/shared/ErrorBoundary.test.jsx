// ═══════════════════════════════════════════════
// Unit tests for ErrorBoundary
//
// Covers:
//   1. Default full-screen error fallback renders when child throws
//   2. Error message from the thrown error is surfaced
//   3. "Try Again" retry button resets the error state
//   4. Custom function fallback is called with { error, retry }
//   5. Custom React-node fallback is rendered as-is
//   6. Children render normally when no error is thrown
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// Suppress React's console.error output for expected render errors.
// React logs the error stack to stderr even when it's caught by an
// error boundary, which pollutes the test output.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

// A child that throws on demand, controlled via a ref-like prop.
function BombChild({ shouldThrow, message = 'test error' }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="child">OK</div>;
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BombChild shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows the default full-screen fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <BombChild shouldThrow message="boom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders a retry button that resets the error state', () => {
    // Use a controlled wrapper so we can stop the child from throwing
    // before clicking retry. If the child still throws after retry,
    // the boundary re-catches immediately and the test never sees
    // the clean render.
    function Controlled() {
      const [throwing, setThrowing] = useState(true);
      return (
        <>
          <button data-testid="stop-btn" onClick={() => setThrowing(false)}>
            stop
          </button>
          <ErrorBoundary>
            <BombChild shouldThrow={throwing} message="boom" />
          </ErrorBoundary>
        </>
      );
    }

    render(<Controlled />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // First disable the throw, then click retry so the boundary
    // re-renders children successfully.
    fireEvent.click(screen.getByTestId('stop-btn'));
    fireEvent.click(screen.getByText('↺ Try Again'));

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls a function fallback with { error, retry } when provided', () => {
    const customFallback = vi.fn(({ error }) => (
      <div data-testid="custom-fallback">{error.message}</div>
    ));

    render(
      <ErrorBoundary fallback={customFallback}>
        <BombChild shouldThrow message="custom error" />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('custom error')).toBeInTheDocument();
    // The function receives an object with error and retry props.
    expect(customFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'custom error' }),
        retry: expect.any(Function),
      }),
    );
    // The default full-screen overlay must NOT appear.
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders a React-node fallback directly when provided', () => {
    const nodeFallback = <div data-testid="node-fallback">Oops!</div>;

    render(
      <ErrorBoundary fallback={nodeFallback}>
        <BombChild shouldThrow message="node fallback test" />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('node-fallback')).toBeInTheDocument();
    expect(screen.getByText('Oops!')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('the retry callback passed to a function fallback resets the error', () => {
    let capturedRetry;
    const customFallback = vi.fn(({ retry }) => {
      capturedRetry = retry;
      return <div data-testid="custom-fallback">Fallback</div>;
    });

    const { rerender } = render(
      <ErrorBoundary fallback={customFallback}>
        <BombChild shouldThrow message="retry test" />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

    // Fire the retry callback surfaced to the fallback component.
    fireEvent.click(document.createElement('button')); // focus reset
    capturedRetry();

    rerender(
      <ErrorBoundary fallback={customFallback}>
        <BombChild shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
  });
});
