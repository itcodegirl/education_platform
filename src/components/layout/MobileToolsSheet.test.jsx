import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MobileToolsSheet } from './MobileToolsSheet';

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
  it('renders a compact learning tools dialog', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: /learning tools/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toHaveTextContent('Find a lesson');
    expect(screen.getByRole('button', { name: /progress/i })).toHaveTextContent('Course status');
  });

  it('closes and runs the selected tool', () => {
    const { onClose, onSearch } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const { onClose } = renderSheet();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render while closed', () => {
    render(<MobileToolsSheet isOpen={false} onClose={() => {}} tools={[]} />);

    expect(screen.queryByRole('dialog', { name: /learning tools/i })).not.toBeInTheDocument();
  });
});
