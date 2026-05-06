import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUseIsMobile, mockUsePrefersReducedData } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(),
  mockUsePrefersReducedData: vi.fn(),
}));

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('../../hooks/usePrefersReducedData', () => ({
  usePrefersReducedData: () => mockUsePrefersReducedData(),
}));

vi.mock('../../services/aiService', () => ({
  askChallengeTutor: vi.fn(),
}));

import { CodeChallenge } from './CodeChallenge';

beforeEach(() => {
  mockUseIsMobile.mockReturnValue(true);
  mockUsePrefersReducedData.mockReturnValue(false);
});

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

  it('uses the lightweight textarea editor when prefers-reduced-data is set on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUsePrefersReducedData.mockReturnValue(true);

    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    // Textarea fallback (Code editor) is rendered, not the Monaco
    // "Loading editor..." Suspense fallback.
    expect(screen.getByLabelText(/code editor/i)).toHaveProperty('tagName', 'TEXTAREA');
    // The opt-in escape hatch is offered on desktop.
    expect(
      screen.getByRole('button', { name: /load full editor/i }),
    ).toBeInTheDocument();
  });

  it('does not show the load-full override on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUsePrefersReducedData.mockReturnValue(false);

    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    expect(screen.getByLabelText(/code editor/i)).toHaveProperty('tagName', 'TEXTAREA');
    expect(
      screen.queryByRole('button', { name: /load full editor/i }),
    ).not.toBeInTheDocument();
  });
});
