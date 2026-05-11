import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  beforeEach(() => {
    Object.values(handlers).forEach((handler) => handler.mockClear());
  });

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

  it('supports expected keyboard navigation inside the learning tools menu', async () => {
    render(<BottomToolbar {...handlers} activePanel={null} />);

    const trigger = screen.getByRole('button', { name: /open learning tools/i });
    fireEvent.click(trigger);

    const menu = screen.getByRole('menu', { name: /learning tools/i });
    const reviewQueue = screen.getByRole('menuitemcheckbox', { name: /review queue/i });
    const badges = screen.getByRole('menuitemcheckbox', { name: /badges/i });
    const print = screen.getByRole('menuitem', { name: /print \/ pdf/i });

    expect(trigger).toHaveAttribute('aria-controls', 'learning-tools-menu');
    expect(screen.getByRole('button', { name: /close learning tools/i })).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(reviewQueue).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(badges).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'End' });
    expect(print).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(reviewQueue).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
