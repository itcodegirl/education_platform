/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ProfilePage } from './ProfilePage';

const {
  mockSignOut,
  mockMaybeSingle,
  mockUpdateEq,
} = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockUpdateEq: vi.fn(),
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
  useProgressData: () => ({
    completed: ['c:html|m:m1|l:l1'],
    quizScores: { 'l:html:l1': '1/1' },
    challengeCompletions: ['html-challenge-1'],
  }),
  useXP: () => ({
    xpTotal: 150,
    streak: 3,
    pausedStreak: null,
    earnedBadges: { 'first-lesson': true },
  }),
  useSR: () => ({
    bookmarks: [{ lessonKey: 'c:html|m:m1|l:l1' }],
    notes: { 'c:html|m:m1|l:l1': 'Remember semantic headings.' },
    srCards: [],
  }),
}));

vi.mock('../../data/reference/course-catalog', () => ({
  COURSE_CATALOG: [
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
        eq: mockUpdateEq,
      }),
    }),
  },
}));

describe('ProfilePage accessibility', () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockMaybeSingle.mockReset();
    mockUpdateEq.mockReset();
    mockMaybeSingle.mockResolvedValue({
      data: { is_public: false, public_handle: '' },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it('has no detectable accessibility violations in the default profile state', async () => {
    const { container } = render(<ProfilePage onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current learning status/i)).toHaveTextContent(/lessons completed/i);
    expect(screen.getByRole('heading', { name: /private learning transcript/i })).toBeInTheDocument();
    expect(screen.getByText(/strong learning proof/i)).toBeInTheDocument();
    expect(screen.getAllByText(/not a verified credential/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('list', { name: /1 of 2 badges earned/i })).toBeInTheDocument();

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });

  it('connects public handle validation feedback to the field', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { is_public: true, public_handle: '' },
      error: null,
    });

    render(<ProfilePage onClose={vi.fn()} />);

    const handle = await screen.findByRole('textbox', { name: /handle/i });
    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/handle must be 2-30 chars/i);
    expect(handle).toHaveAttribute('aria-invalid', 'true');
    expect(handle).toHaveAccessibleDescription(/use 2 to 30 characters/i);
  });

  it('keeps duplicate-handle save feedback clear and specific', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { is_public: true, public_handle: 'ada' },
      error: null,
    });
    mockUpdateEq.mockResolvedValueOnce({
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "profiles_public_handle_key"',
      },
    });

    render(<ProfilePage onClose={vi.fn()} />);

    await screen.findByRole('textbox', { name: /handle/i });
    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/That handle is already taken/i);
    expect(screen.queryByText(/duplicate key value/i)).not.toBeInTheDocument();
  });

  it('keeps generic public-profile save failures safe for learners', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { is_public: true, public_handle: 'ada' },
      error: null,
    });
    mockUpdateEq.mockResolvedValueOnce({
      error: {
        code: 'PGRST301',
        message: 'permission denied for table profiles',
      },
    });

    render(<ProfilePage onClose={vi.fn()} />);

    await screen.findByRole('textbox', { name: /handle/i });
    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not save public profile settings/i);
    expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument();
  });
});
