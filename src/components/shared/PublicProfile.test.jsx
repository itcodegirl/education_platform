/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockFrom, mockSelect, mockIlike, mockMaybeSingle } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockIlike: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: (...args) => {
      mockFrom(...args);
      return {
        select: (...args) => {
          mockSelect(...args);
          return {
            ilike: (...args) => {
              mockIlike(...args);
              return {
                maybeSingle: () => mockMaybeSingle(),
              };
            },
          };
        },
      };
    },
  },
}));

vi.mock('./Logo', () => ({
  Logo: () => null,
}));

import { PublicProfile } from './PublicProfile';

beforeEach(() => {
  mockFrom.mockReset();
  mockSelect.mockReset();
  mockIlike.mockReset();
  mockMaybeSingle.mockReset();
});

describe('PublicProfile', () => {
  it('announces the loading state to assistive tech', () => {
    // Never resolves: keep the component in its loading branch.
    mockMaybeSingle.mockReturnValue(new Promise(() => {}));

    render(<PublicProfile handle="ada" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent(/Loading profile/i);
  });

  it('renders an alert with the not-found copy when the handle has no public profile', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    render(<PublicProfile handle="ghost-user" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Profile not found/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/ghost-user/);
  });

  it('renders an alert when the handle prop is missing', async () => {
    render(<PublicProfile handle="" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('offers a safe retry path when the public profile cannot load', async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'permission denied for public_profiles' },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'profile-1',
          display_name: 'Ada',
          avatar_url: null,
          handle: 'ada',
          xp_total: 120,
          streak_days: 3,
          lessons_completed: 4,
          badges_earned: 2,
        },
        error: null,
      });

    render(<PublicProfile handle="ada" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Check your connection and try again/i);
    expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ada/i })).toBeInTheDocument();
    });
    expect(mockMaybeSingle).toHaveBeenCalledTimes(2);
  });

  it('publicProfileDoesNotExposeRawProgressRows', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'profile-1',
        display_name: 'Ada',
        avatar_url: null,
        handle: 'ada',
        xp_total: 120,
        streak_days: 3,
        lessons_completed: 4,
        badges_earned: 2,
      },
      error: null,
    });

    render(<PublicProfile handle="ada" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ada/i })).toBeInTheDocument();
    });

    expect(mockFrom).toHaveBeenCalledWith('public_profiles');
    expect(mockSelect).toHaveBeenCalledWith(
      'id, display_name, avatar_url, handle, xp_total, streak_days, lessons_completed, badges_earned',
    );
    expect(mockSelect.mock.calls[0][0]).not.toMatch(/lesson_key|progress|completed_at/i);
    expect(mockIlike).toHaveBeenCalledWith('handle', 'ada');
  });
});
