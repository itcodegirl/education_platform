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
    { key: 'search', label: 'Search', helper: 'Find a lesson', onSelect: onSearch },
    { key: 'stats', label: 'Progress', helper: 'Course status', onSelect: onProgress },
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
    expect(screen.getByRole('button', { name: /search/i })).toHaveTextContent('Find a lesson');
    expect(screen.getByRole('button', { name: /progress/i })).toHaveTextContent('Course status');
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

    expect(screen.getByText(/Complete the current lesson to unlock more learning tools/i)).toBeInTheDocument();
  });

  it('does not render while closed', () => {
    render(<MobileToolsSheet isOpen={false} onClose={() => {}} tools={[]} />);

    expect(screen.queryByRole('dialog', { name: /learning tools/i })).not.toBeInTheDocument();
  });
});
