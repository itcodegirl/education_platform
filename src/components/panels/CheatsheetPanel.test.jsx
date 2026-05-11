import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheatsheetPanel } from './CheatsheetPanel';

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

describe('CheatsheetPanel', () => {
  it('exposes course filters and reference groups with clear semantics', () => {
    render(<CheatsheetPanel isOpen onClose={vi.fn()} currentCourse="html" />);

    expect(screen.getByRole('dialog', { name: /html cheat sheet/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /cheat sheet course tracks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show html cheat sheet/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: /html cheat sheet content/i })).toBeInTheDocument();

    const documentStructure = screen.getByRole('list', { name: /document structure references/i });
    expect(within(documentStructure).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('updates the selected reference track without closing the panel', () => {
    const onClose = vi.fn();
    render(<CheatsheetPanel isOpen onClose={onClose} currentCourse="html" />);

    fireEvent.click(screen.getByRole('button', { name: /show css cheat sheet/i }));

    expect(screen.getByRole('button', { name: /show css cheat sheet/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: /css cheat sheet content/i })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
