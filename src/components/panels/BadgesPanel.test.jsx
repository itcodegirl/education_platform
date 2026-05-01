import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgesPanel } from './BadgesPanel';

const { mockUseXP } = vi.hoisted(() => ({ mockUseXP: vi.fn() }));

vi.mock('../../providers', async () => {
  // Re-export the real BADGE_DEFS so the rendered list matches the
  // catalog the user actually sees, while still mocking useXP.
  const actual = await vi.importActual('../../providers');
  return {
    ...actual,
    useXP: () => mockUseXP(),
  };
});

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

describe('BadgesPanel', () => {
  beforeEach(() => {
    mockUseXP.mockReturnValue({ earnedBadges: {} });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<BadgesPanel isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the badges grid with list semantics so screen readers can navigate it', () => {
    render(<BadgesPanel isOpen onClose={() => {}} />);

    // The grid is a real <ul> announced as a list, with an aria-label
    // summarizing total earned vs total available.
    const list = screen.getByRole('list', { name: /badges earned/i });
    expect(list).toBeInTheDocument();

    // Each badge is a <li> the user can iterate over.
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('marks an earned badge with its earned date in the aria-label', () => {
    mockUseXP.mockReturnValue({
      earnedBadges: { first_lesson: { date: '2026-04-30' } },
    });

    render(<BadgesPanel isOpen onClose={() => {}} />);

    const earnedBadge = screen.getByRole('listitem', { name: /First Steps, earned on 2026-04-30/i });
    expect(earnedBadge).toBeInTheDocument();
    expect(earnedBadge.className).toContain('earned');
  });

  it('marks an unearned badge as locked in the aria-label', () => {
    render(<BadgesPanel isOpen onClose={() => {}} />);

    const lockedBadge = screen.getByRole('listitem', { name: /First Steps, locked/i });
    expect(lockedBadge).toBeInTheDocument();
    expect(lockedBadge.className).toContain('locked');
  });

  it('marks the decorative badge icon emoji as aria-hidden', () => {
    render(<BadgesPanel isOpen onClose={() => {}} />);

    // The icon is decorative — its meaning is conveyed by the
    // surrounding name + description, so screen readers should skip it.
    const icons = document.querySelectorAll('.badge-icon');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('exposes the earned-count summary in the modal title and the list label', () => {
    mockUseXP.mockReturnValue({
      earnedBadges: {
        first_lesson: { date: '2026-04-29' },
        first_quiz: { date: '2026-04-30' },
      },
    });

    render(<BadgesPanel isOpen onClose={() => {}} />);

    // Visible heading.
    expect(screen.getByRole('heading', { name: /badges \(2\/18\)/i })).toBeInTheDocument();
    // Programmatic list label — same numbers, screen-reader-friendly phrasing.
    expect(screen.getByRole('list', { name: /2 of 18 badges earned/i })).toBeInTheDocument();
  });
});
