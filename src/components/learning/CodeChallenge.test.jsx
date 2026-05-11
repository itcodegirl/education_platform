import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

vi.mock('./challenge/challengePreviewBridge', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createChallengePreviewTestFrame: vi.fn(async (iframeEl) => iframeEl),
  };
});

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
    // "Opening editor..." Suspense fallback.
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

  it('renders the challenge preview iframe with the hardened sandbox', () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    const iframe = screen.getByTitle(/challenge preview/i);
    expect(iframe).toHaveAttribute('sandbox');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('runs the challenge checks from the action button and shows the passing result state', async () => {
    const onComplete = vi.fn();
    render(<CodeChallenge challenge={baseChallenge} lang="html" onComplete={onComplete} />);

    fireEvent.load(screen.getByTitle(/challenge preview/i));
    fireEvent.click(screen.getByRole('button', { name: /run tests/i }));

    await waitFor(() => {
      expect(screen.getByText(/All tests passed! You nailed it./i)).toBeInTheDocument();
    });
    expect(screen.getByText(/some checks inspect your code/i)).toBeInTheDocument();
    expect(screen.getByText(/safe preview snapshot/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('explains what the challenge grader checks before running tests', () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    expect(screen.getByText(/This grader checks specific requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/matched the expected checks/i)).toBeInTheDocument();
  });

  it('uses a clear reset label in the challenge editor', () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    expect(screen.getByRole('button', { name: /reset code/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry reset/i })).not.toBeInTheDocument();
  });

  it('explains challenge grader limits without overstating mastery', async () => {
    render(<CodeChallenge challenge={baseChallenge} lang="html" />);

    fireEvent.load(screen.getByTitle(/challenge preview/i));
    fireEvent.click(screen.getByRole('button', { name: /run tests/i }));

    await waitFor(() => {
      expect(screen.getByText(/Some checks inspect the preview DOM or computed styles/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/not that the whole skill is verified/i)).toBeInTheDocument();
  });
});
