/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseProgressData, mockUseXP, mockUseAuth } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseXP: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
  useXP: () => mockUseXP(),
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => {},
}));

vi.mock('../../routes/routeUtils', () => ({
  navigateTo: vi.fn(),
}));

import { ProfilePopover } from './ProfilePopover';

beforeEach(() => {
  mockUseProgressData.mockReturnValue({ completed: [] });
  mockUseAuth.mockReturnValue({
    user: { email: 'ada@example.com', user_metadata: { display_name: 'Ada' } },
    signOut: vi.fn(),
  });
});

describe('ProfilePopover streak stat', () => {
  it('shows the active streak with the fire glyph', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 100,
      streak: 4,
      pausedStreak: null,
      dailyCount: 1,
    });

    render(<ProfilePopover isOpen onClose={vi.fn()} isMobile={false} />);

    // The streak value sits next to the 🔥 inside the Streak stat.
    expect(screen.getByText('Streak')).toBeInTheDocument();
    // Find the stat block containing "Streak" and assert the
    // value + glyph render.
    const streakLabel = screen.getByText('Streak');
    const streakBlock = streakLabel.parentElement;
    expect(streakBlock).toHaveTextContent('4');
    expect(streakBlock).toHaveTextContent('🔥');
    expect(streakBlock).not.toHaveTextContent('??');
  });

  it('shows the paused-streak count + 💤 when streak is 0 but a paused streak exists', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 100,
      streak: 0,
      pausedStreak: { days: 7, lastDate: '2025-01-01' },
      dailyCount: 0,
    });

    render(<ProfilePopover isOpen onClose={vi.fn()} isMobile={false} />);

    const pausedLabel = screen.getByText('Streak paused');
    const block = pausedLabel.parentElement;
    expect(block).toHaveTextContent('7');
    expect(block).toHaveTextContent('💤');
  });

  it('renders the bare 0 when there is no streak history at all', () => {
    mockUseXP.mockReturnValue({
      xpTotal: 0,
      streak: 0,
      pausedStreak: null,
      dailyCount: 0,
    });

    render(<ProfilePopover isOpen onClose={vi.fn()} isMobile={false} />);

    const block = screen.getByText('Streak').parentElement;
    expect(block).toHaveTextContent('0');
    expect(block).not.toHaveTextContent('🔥');
    expect(block).not.toHaveTextContent('💤');
    expect(block).not.toHaveTextContent('??');
  });
});
