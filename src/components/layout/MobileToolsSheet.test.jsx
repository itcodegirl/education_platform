import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MobileToolsSheet } from './MobileToolsSheet';

const { mockUseFocusTrap } = vi.hoisted(() => ({
  mockUseFocusTrap: vi.fn(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: mockUseFocusTrap,
}));

function renderSheet(overrides = {}) {
  const onClose = vi.fn();
  const onSearch = vi.fn();
  const onProgress = vi.fn();
  const tools = [
    { key: 'search', icon: 'S', label: 'Search', helper: 'Find a lesson', onSelect: onSearch },
    { key: 'stats', icon: '%', label: 'Progress', helper: 'Course status', onSelect: onProgress },
  ];

  render(
    <MobileToolsSheet
      isOpen
      onClose={onClose}
      tools={tools}
      activePanel={null}
      {...overrides}
    />,
  );

  return { onClose, onSearch, onProgress };
}

describe('MobileToolsSheet', () => {
  beforeEach(() => {
    mockUseFocusTrap.mockClear();
  });

  it('renders a compact learning tools dialog', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: /learning tools/i })).toBeInTheDocument();
    expect(screen.getByText(/keep the lesson first/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search: find a lesson/i })).toHaveTextContent('Find a lesson');
    expect(screen.getByRole('button', { name: /progress: course status/i })).toHaveTextContent('Course status');
    expect(screen.getByRole('button', { name: /search: find a lesson/i })).toHaveTextContent('S');
    expect(mockUseFocusTrap).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: true, initialFocus: 'first-tabbable' }),
    );
  });

  it('closes and runs the selected tool', () => {
    const { onClose, onSearch } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('closes from the sheet close button', () => {
    const { onClose } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: /close learning tools/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the backdrop out of the accessibility tree while preserving pointer close', () => {
    const { onClose } = renderSheet();
    const scrim = document.querySelector('.mobile-tools-scrim');

    expect(scrim).toHaveAttribute('aria-hidden', 'true');
    expect(scrim).not.toHaveAttribute('role');
    expect(scrim).not.toHaveAttribute('tabindex');

    fireEvent.click(scrim);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a clear empty state when no tools are available', () => {
    renderSheet({ tools: [] });

    expect(screen.getByText(/More tools unlock after real progress/i)).toBeInTheDocument();
  });

  it('does not render while closed', () => {
    render(<MobileToolsSheet isOpen={false} onClose={() => {}} tools={[]} />);

    expect(screen.queryByRole('dialog', { name: /learning tools/i })).not.toBeInTheDocument();
  });

  it('keeps a tool visible but disabled when its handler is missing', () => {
    renderSheet({
      tools: [{ key: 'projects', icon: '<>', label: 'Projects', helper: 'Build ideas' }],
    });

    expect(screen.getByRole('button', { name: /projects: build ideas/i })).toBeDisabled();
  });

  it('groups support tools below the tools used during the lesson', () => {
    renderSheet({
      tools: [
        { key: 'search', icon: 'S', label: 'Search', helper: 'Find a lesson', onSelect: vi.fn() },
        { key: 'glossary', icon: 'Aa', label: 'Glossary', helper: 'Plain meanings', onSelect: vi.fn() },
      ],
    });

    expect(screen.getByText('Use now')).toBeInTheDocument();
    expect(screen.getByText('Support when needed')).toBeInTheDocument();
  });
});
