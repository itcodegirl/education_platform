import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeChallenge } from './CodeChallenge';

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('../../services/aiService', () => ({
  askChallengeTutor: vi.fn(),
}));

const baseChallenge = {
  title: 'Render a heading',
  description: 'Create an h1 element in the preview.',
  starter: '<div></div>',
  requirements: ['Page contains an h1 element'],
  tests: [
    {
      label: 'contains h1',
      check: () => true,
    },
  ],
  hint: 'Use a semantic heading tag.',
  solution: '<h1>Hello</h1>',
};

describe('CodeChallenge', () => {
  it('shows a soft warning before revealing solution when tests were not attempted', () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    fireEvent.click(screen.getByRole('button', { name: /show solution/i }));

    expect(
      screen.getByText(/You have not run the tests yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('<h1>Hello</h1>')).not.toBeInTheDocument();
  });

  it('can still reveal the solution after explicit confirmation', () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    fireEvent.click(screen.getByRole('button', { name: /show solution/i }));
    fireEvent.click(screen.getByRole('button', { name: /reveal anyway/i }));

    expect(screen.getByText('<h1>Hello</h1>')).toBeInTheDocument();
  });
});

