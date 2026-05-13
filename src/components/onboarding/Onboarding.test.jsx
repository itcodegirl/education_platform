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
  it('keeps the final onboarding step focused on next-step momentum', () => {
    render(<Onboarding isOpen onClose={vi.fn()} displayName="Jenna" />);

    fireEvent.click(screen.getByRole('button', { name: /go to step 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to step 3/i }));

    expect(screen.getByRole('heading', { name: /let the next step stay obvious/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /let the next step stay obvious guidance/i })).toBeInTheDocument();
    expect(screen.getByText(/completion saves reading progress/i)).toBeInTheDocument();
    expect(screen.getByText(/if a quick check appears/i)).toBeInTheDocument();
    expect(screen.getByText(/if review is due, clear the short queue/i)).toBeInTheDocument();
    expect(screen.getByText(/try one small challenge to prove the skill/i)).toBeInTheDocument();
  });
});
