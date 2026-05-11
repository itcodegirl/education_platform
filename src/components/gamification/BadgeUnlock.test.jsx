import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeUnlock } from './BadgeUnlock';

const { mockClearNewBadge } = vi.hoisted(() => ({
  mockClearNewBadge: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useXP: () => ({
    newBadge: {
      id: 'semantic-starter',
      name: 'Semantic Starter',
      desc: 'Complete a semantic HTML lesson.',
      icon: 'S',
    },
    clearNewBadge: mockClearNewBadge,
  }),
}));

describe('BadgeUnlock', () => {
  it('exposes the badge award dialog to assistive technology', () => {
    render(<BadgeUnlock />);

    const dialog = screen.getByRole('alertdialog', { name: /semantic starter/i });

    expect(dialog).toHaveAccessibleDescription(/complete a semantic html lesson/i);
    expect(dialog.closest('.badge-unlock-overlay')).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});
