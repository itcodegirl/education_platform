// ═══════════════════════════════════════════════
// LessonHeader — first React Testing Library test in the project.
//
// LessonHeader is the cleanest component to test with RTL:
//   - pure presentational (no context, no side effects, no hooks)
//   - takes props, renders, fires callbacks
//   - covers the bookmark/notes toggle behavior we care about
//
// The goal of this file is more architectural than exhaustive:
// prove that the project can write and run component tests, so
// future refactors can be locked in with tests instead of manual
// regression sweeps. Aim for behavioral assertions (what the user
// sees, what clicking does) — not implementation details.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonHeader } from './LessonHeader';

const baseProps = {
  lesson: { title: 'Build a Button That Talks' },
  emoji: '⚡',
  moduleTitle: 'JavaScript Awakening',
  difficulty: 'beginner',
  duration: '12 min',
  conceptCount: 3,
  taskCount: 2,
  scaffolding: 'starter',
  bookmarked: false,
  showNotes: false,
  onToggleBookmark: () => {},
  onToggleNotes: () => {},
};

describe('LessonHeader', () => {
  it('renders the lesson title as an h1', () => {
    render(<LessonHeader {...baseProps} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Build a Button That Talks');
  });

  it('renders the module kicker when moduleTitle is provided', () => {
    render(<LessonHeader {...baseProps} />);
    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Awakening')).toBeInTheDocument();
  });

  it('hides the module kicker when moduleTitle is missing', () => {
    render(<LessonHeader {...baseProps} moduleTitle={undefined} />);
    expect(screen.queryByText('Module')).not.toBeInTheDocument();
  });

  it('shows concept and task count chips when > 0', () => {
    render(<LessonHeader {...baseProps} />);
    expect(screen.getByText('3 concepts')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('hides count chips when counts are zero', () => {
    render(<LessonHeader {...baseProps} conceptCount={0} taskCount={0} />);
    expect(screen.queryByText(/concepts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/tasks/)).not.toBeInTheDocument();
  });

  it('shows the starter-code scaffolding chip', () => {
    render(<LessonHeader {...baseProps} scaffolding="starter" />);
    expect(screen.getByText(/Starter code/)).toBeInTheDocument();
  });

  it('hides the scaffolding chip for "full" scaffolding', () => {
    render(<LessonHeader {...baseProps} scaffolding="full" />);
    expect(screen.queryByText(/Partial template/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Starter code/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Write from scratch/)).not.toBeInTheDocument();
  });

  describe('bookmark button', () => {
    it('shows the empty star and aria-pressed="false" when not bookmarked', () => {
      render(<LessonHeader {...baseProps} bookmarked={false} />);
      const btn = screen.getByRole('button', { name: /bookmark this lesson/i });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      expect(btn).toHaveTextContent('☆');
    });

    it('shows the filled star and aria-pressed="true" when bookmarked', () => {
      render(<LessonHeader {...baseProps} bookmarked={true} />);
      const btn = screen.getByRole('button', { name: /remove bookmark/i });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(btn).toHaveTextContent('★');
    });

    it('fires onToggleBookmark when clicked', () => {
      const onToggleBookmark = vi.fn();
      render(<LessonHeader {...baseProps} onToggleBookmark={onToggleBookmark} />);
      const btn = screen.getByRole('button', { name: /bookmark this lesson/i });
      btn.click();
      expect(onToggleBookmark).toHaveBeenCalledTimes(1);
    });
  });

  describe('notes button', () => {
    it('reflects showNotes via aria-expanded', () => {
      const { rerender } = render(<LessonHeader {...baseProps} showNotes={false} />);
      expect(screen.getByRole('button', { name: /toggle lesson notes/i })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      rerender(<LessonHeader {...baseProps} showNotes={true} />);
      expect(screen.getByRole('button', { name: /toggle lesson notes/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('fires onToggleNotes when clicked', () => {
      const onToggleNotes = vi.fn();
      render(<LessonHeader {...baseProps} onToggleNotes={onToggleNotes} />);
      screen.getByRole('button', { name: /toggle lesson notes/i }).click();
      expect(onToggleNotes).toHaveBeenCalledTimes(1);
    });
  });
});
