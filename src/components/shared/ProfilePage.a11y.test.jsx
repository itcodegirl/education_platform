/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ProfilePage } from './ProfilePage';

const {
  mockEnsureAllLoaded,
  mockSignOut,
  mockMaybeSingle,
} = vi.hoisted(() => ({
  mockEnsureAllLoaded: vi.fn(),
  mockSignOut: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock('../../providers', () => ({
  BADGE_DEFS: [
    { id: 'first-lesson', name: 'First Lesson', desc: 'Complete one lesson.', icon: '1' },
    { id: 'steady', name: 'Steady Builder', desc: 'Keep learning.', icon: '2' },
  ],
  useAuth: () => ({
    user: {
      id: 'learner-1',
      email: 'learner@example.test',
      created_at: '2026-01-01T00:00:00Z',
      user_metadata: { display_name: 'Jenna' },
    },
    profile: { display_name: 'Jenna' },
    signOut: mockSignOut,
  }),
  useTheme: () => ({ theme: 'dark' }),
  useCourseContent: () => ({ ensureAllLoaded: mockEnsureAllLoaded }),
  useProgressData: () => ({ completed: ['c:html|m:m1|l:l1'] }),
  useXP: () => ({
    xpTotal: 150,
    streak: 3,
    pausedStreak: null,
    earnedBadges: { 'first-lesson': true },
  }),
  useSR: () => ({
    bookmarks: [{ lessonKey: 'c:html|m:m1|l:l1' }],
    notes: { 'c:html|m:m1|l:l1': 'Remember semantic headings.' },
  }),
}));

vi.mock('../../data', () => ({
  COURSES: [
    {
      id: 'html',
      label: 'HTML',
      icon: 'H',
      accent: '#ff6b6b',
      modules: [
        {
          id: 'm1',
          title: 'Foundations',
          lessons: [{ id: 'l1', title: 'Structure a Page' }],
        },
      ],
    },
  ],
}));

vi.mock('../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: () => {},
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
      update: () => ({
        eq: vi.fn(async () => ({ error: null })),
      }),
    }),
  },
}));

describe('ProfilePage accessibility', () => {
  beforeEach(() => {
    mockEnsureAllLoaded.mockReset();
    mockSignOut.mockReset();
    mockMaybeSingle.mockReset();
    mockMaybeSingle.mockResolvedValue({
      data: { is_public: false, public_handle: '' },
      error: null,
    });
  });

  it('has no detectable accessibility violations in the default profile state', async () => {
    const { container } = render(<ProfilePage onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current learning status/i)).toHaveTextContent(/lessons completed/i);
    expect(screen.getByRole('list', { name: /1 of 2 badges earned/i })).toBeInTheDocument();

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
