import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeChallenge } from './CodeChallenge';

const { mockUseIsMobile, mockUseReducedData } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(),
  mockUseReducedData: vi.fn(),
}));

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('../../hooks/useReducedData', () => ({
  useReducedData: () => mockUseReducedData(),
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
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseReducedData.mockReturnValue(false);
  });

  it('challenge-sandbox.cannot-access-parent-window', () => {
    render(
      <CodeChallenge
        challenge={{
          ...baseChallenge,
          starter: '<script>parent.document.body.dataset.pwned = "1"; localStorage.setItem("x", "1");</script>',
        }}
        lang="html"
      />,
    );

    const iframe = screen.getByTitle('Challenge Preview');

    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.getAttribute('srcdoc')).toContain('parent.document.body');
  });

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

  it('reduced-data.uses-textarea-not-monaco', () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseReducedData.mockReturnValue(true);

    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
  });
});

