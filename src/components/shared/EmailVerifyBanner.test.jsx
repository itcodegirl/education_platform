/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EmailVerifyBanner } from './EmailVerifyBanner';

const mockResendConfirmation = vi.fn();

vi.mock('../../providers', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../providers';

function setup(userOverrides = {}) {
  const defaultUser = { email: 'learner@example.com', email_confirmed_at: null };
  useAuth.mockReturnValue({
    user: { ...defaultUser, ...userOverrides },
    resendConfirmation: mockResendConfirmation,
  });
}

describe('EmailVerifyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResendConfirmation.mockResolvedValue({ error: null });
  });

  it('renders when user is unverified', () => {
    setup();
    render(<EmailVerifyBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend email/i })).toBeInTheDocument();
  });

  it('does not render when user is null', () => {
    useAuth.mockReturnValue({ user: null, resendConfirmation: mockResendConfirmation });
    const { container } = render(<EmailVerifyBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when email is already confirmed', () => {
    setup({ email_confirmed_at: '2026-01-01T00:00:00Z' });
    const { container } = render(<EmailVerifyBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('calls resendConfirmation with the user email and shows sent state', async () => {
    setup();
    render(<EmailVerifyBanner />);

    fireEvent.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      expect(mockResendConfirmation).toHaveBeenCalledWith('learner@example.com');
      expect(screen.getByRole('button', { name: /email sent/i })).toBeInTheDocument();
    });
  });

  it('shows an error message when resend fails', async () => {
    mockResendConfirmation.mockResolvedValue({ error: { message: 'rate limit' } });
    setup();
    render(<EmailVerifyBanner />);

    fireEvent.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/couldn't send/i);
    });
  });

  it('dismisses the banner when the dismiss button is clicked', () => {
    setup();
    render(<EmailVerifyBanner />);

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
