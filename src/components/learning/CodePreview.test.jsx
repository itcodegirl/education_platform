import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodePreview } from './CodePreview';

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('../../hooks/usePrefersReducedData', () => ({
  usePrefersReducedData: () => false,
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
      screen.queryByRole('tab', { name: /^(?:<>|f|\{\s*\})\s*code$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /write code/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/start with one small piece/i)).toBeInTheDocument();
  });

  it('copies source code from code tab', () => {
    render(<CodePreview code="console.log('hi')" lang="js" scaffolding="full" />);

    expect(screen.getByLabelText(/javascript code sample/i)).toHaveAttribute('tabIndex', '0');

    fireEvent.click(screen.getByRole('button', { name: /copy code to clipboard/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("console.log('hi')");
  });

  it('makes the scrollable source code pane keyboard focusable', () => {
    render(<CodePreview code="<h1>Hello</h1>" lang="html" scaffolding="full" />);

    const codePane = screen.getByLabelText('HTML code sample');
    expect(codePane.tagName).toBe('PRE');
    expect(codePane).toHaveAttribute('tabindex', '0');
  });

  it('renders iframe preview when Preview tab is selected', () => {
    render(<CodePreview code="<main>Preview Me</main>" lang="html" scaffolding="full" />);

    fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

    const frame = screen.getByTitle('HTML preview');
    expect(frame).toBeInTheDocument();
    expect(frame.getAttribute('srcdoc')).toContain('<main>Preview Me</main>');
  });

  it('supports arrow-key navigation across preview tabs', () => {
    render(<CodePreview code="<main>Preview Me</main>" lang="html" scaffolding="full" />);

    const codeTab = screen.getByRole('tab', { name: /code/i });
    fireEvent.keyDown(codeTab, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: /editor/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /editor/i })).toBeInTheDocument();
  });

  it('marks active practice views as tabs for assistive technology', () => {
    render(<CodePreview code="<h1>Hello</h1>" lang="html" scaffolding="full" />);

    expect(screen.getByRole('tablist', { name: /code practice views/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /code/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: /editor/i }));

    expect(screen.getByRole('tab', { name: /editor/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/change one small detail/i)).toBeInTheDocument();
  });
});
