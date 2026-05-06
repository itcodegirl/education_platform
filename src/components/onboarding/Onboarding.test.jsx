import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Onboarding } from './Onboarding';

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: () => [false, vi.fn()],
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('Onboarding', () => {
  it('keeps the final onboarding step focused on first-session sequencing', () => {
    render(<Onboarding isOpen onClose={vi.fn()} displayName="Jenna" />);

    fireEvent.click(screen.getByRole('button', { name: /go to step 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to step 3/i }));

    expect(screen.getByRole('heading', { name: /your first session has one path/i })).toBeInTheDocument();
    expect(screen.getByText(/read the learning frame/i)).toBeInTheDocument();
    expect(screen.getByText(/mark the lesson complete/i)).toBeInTheDocument();
  });
});
