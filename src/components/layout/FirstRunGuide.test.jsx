import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FirstRunGuide } from './FirstRunGuide';
import { FIRST_SESSION_STEPS } from '../../utils/learnerContract';

describe('FirstRunGuide', () => {
  it('keeps the first session focused on reading progress', () => {
    render(<FirstRunGuide learnerName="Jenna" courseLabel="HTML" />);

    expect(screen.getByRole('region', { name: /getting started/i })).toHaveTextContent(
      'Complete lesson',
    );
    expect(screen.getByText(/saves reading progress/i)).toBeInTheDocument();

    const list = screen.getByRole('list', { name: /first session steps/i });
    FIRST_SESSION_STEPS.forEach((step) => {
      expect(within(list).getByText(step)).toBeInTheDocument();
    });
  });
});
