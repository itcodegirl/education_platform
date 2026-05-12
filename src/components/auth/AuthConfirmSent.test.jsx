/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthConfirmSent } from './AuthConfirmSent';

vi.mock('../layout/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../shared/Logo', () => ({
  Logo: () => <div data-testid="logo" />,
}));

describe('AuthConfirmSent', () => {
  it('renders the email and announces the result politely', () => {
    render(<AuthConfirmSent email="learner@example.com" onBack={() => {}} />);

    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText('learner@example.com')).toBeInTheDocument();
    // role=status implies aria-live=polite, used to announce the
    // signup-confirmation result without stealing focus.
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('invokes onBack when the back-to-login button is clicked', () => {
    const onBack = vi.fn();
    render(<AuthConfirmSent email="learner@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /return to login/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not offer resend or preview when handlers are absent', () => {
    render(<AuthConfirmSent email="learner@example.com" onBack={() => {}} />);

    expect(screen.queryByRole('button', { name: /resend the link/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /first lesson/i })).not.toBeInTheDocument();
  });

  it('resends the confirmation email and confirms success', async () => {
    const onResend = vi.fn().mockResolvedValue({ error: null });
    render(<AuthConfirmSent email="learner@example.com" onBack={() => {}} onResend={onResend} />);

    fireEvent.click(screen.getByRole('button', { name: /resend the link/i }));

    await waitFor(() => {
      expect(onResend).toHaveBeenCalledWith('learner@example.com');
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('surfaces a friendly message when resend fails', async () => {
    const onResend = vi.fn().mockResolvedValue({ error: { message: 'rate limit exceeded' } });
    render(<AuthConfirmSent email="learner@example.com" onBack={() => {}} onResend={onResend} />);

    fireEvent.click(screen.getByRole('button', { name: /resend the link/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
    });
  });

  it('lets the learner jump to the lesson preview while waiting', () => {
    const onPreview = vi.fn();
    render(<AuthConfirmSent email="learner@example.com" onBack={() => {}} onPreview={onPreview} />);

    fireEvent.click(screen.getByRole('button', { name: /first lesson/i }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
