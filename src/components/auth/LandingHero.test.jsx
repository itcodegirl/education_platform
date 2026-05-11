import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingHeroIntro } from './LandingHero';

describe('LandingHeroIntro', () => {
  it('keeps public calls to action learner-facing', () => {
    const onPreview = vi.fn();

    render(<LandingHeroIntro onStart={vi.fn()} onPreview={onPreview} compact />);

    expect(screen.getByRole('button', { name: /create a free account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview the first lesson/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /design system/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /preview the first lesson/i }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
