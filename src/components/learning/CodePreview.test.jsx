import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodePreview } from './CodePreview';

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('../../services/aiService', () => ({
  explainCode: vi.fn(),
}));

describe('CodePreview', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn() },
    });
  });

  it('defaults to editor mode for requirements scaffolding and hides Code tab', () => {
    render(<CodePreview code="<h1>Hello</h1>" lang="html" scaffolding="requirements" />);

    expect(
      screen.queryByRole('button', { name: /^(?:<>|f|\{\s*\})\s*code$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /write code/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('copies source code from code tab', () => {
    render(<CodePreview code="console.log('hi')" lang="js" scaffolding="full" />);

    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("console.log('hi')");
  });

  it('renders iframe preview when Preview tab is selected', () => {
    render(<CodePreview code="<main>Preview Me</main>" lang="html" scaffolding="full" />);

    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    const frame = screen.getByTitle('Preview');
    expect(frame).toBeInTheDocument();
    expect(frame.getAttribute('srcdoc')).toContain('<main>Preview Me</main>');
  });
});
