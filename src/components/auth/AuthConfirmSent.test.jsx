/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
