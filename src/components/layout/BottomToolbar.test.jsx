import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BottomToolbar } from './BottomToolbar';

vi.mock('../../providers', () => ({
  useSR: () => ({
    bookmarks: [{ lessonKey: 'html:intro' }],
    getDueSRCards: () => [{ question: 'What is semantic HTML?' }],
  }),
}));

const handlers = {
  onCheatsheet: vi.fn(),
  onGlossary: vi.fn(),
  onProjects: vi.fn(),
  onBadges: vi.fn(),
  onSR: vi.fn(),
  onBookmarks: vi.fn(),
  onChallenges: vi.fn(),
  onStats: vi.fn(),
};

describe('BottomToolbar', () => {
  it('uses checked menu semantics for selectable panel tools', () => {
    render(<BottomToolbar {...handlers} activePanel="sr" />);

    fireEvent.click(screen.getByRole('button', { name: /open learning tools/i }));

    expect(
      screen.getByRole('menuitemcheckbox', { name: /review queue/i }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: /badges/i }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitem', { name: /print \/ pdf/i })).toBeInTheDocument();
  });
});
