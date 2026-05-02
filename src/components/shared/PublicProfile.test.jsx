/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockMaybeSingle } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
  },
}));

vi.mock('./Logo', () => ({
  Logo: () => null,
}));

import { PublicProfile } from './PublicProfile';

beforeEach(() => {
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
  });
});
