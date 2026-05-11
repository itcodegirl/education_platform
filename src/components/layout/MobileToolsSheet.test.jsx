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
    expect(screen.getByRole('button', { name: /^search$/i })).toHaveAccessibleDescription('Find a lesson');
    expect(screen.getByRole('button', { name: /progress/i })).toHaveAccessibleDescription('Course status');
    expect(screen.getByRole('button', { name: /^search$/i })).toHaveTextContent('S');
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

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

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

  it('keeps an unavailable tool visible, described, and inert', () => {
    const { onClose } = renderSheet({
      tools: [{ key: 'projects', icon: '<>', label: 'Projects', helper: 'Build ideas' }],
    });
    const unavailableTool = screen.getByRole('button', { name: /projects/i });

    expect(unavailableTool).toHaveAttribute('aria-disabled', 'true');
    expect(unavailableTool).toHaveAccessibleDescription(/Build ideas.*Unavailable until you make learning progress\./i);

    fireEvent.click(unavailableTool);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('exposes tool groups with accessible section names', () => {
    renderSheet({
      tools: [
        { key: 'search', icon: 'S', label: 'Search', helper: 'Find a lesson', onSelect: vi.fn() },
        { key: 'glossary', icon: 'Aa', label: 'Glossary', helper: 'Plain meanings', onSelect: vi.fn() },
      ],
    });

    expect(screen.getByRole('region', { name: /use now/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /support when needed/i })).toBeInTheDocument();
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
