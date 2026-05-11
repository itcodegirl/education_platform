import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

function TrapHarness({
  initialFocus = 'container',
  lockBodyScroll = true,
  onEscape = vi.fn(),
  includeFixedAction = false,
} = {}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, {
    enabled: open,
    initialFocus,
    lockBodyScroll,
    onEscape: () => {
      onEscape();
      setOpen(false);
    },
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      {open && (
        <div ref={dialogRef} role="dialog" aria-label="Practice dialog" tabIndex={-1}>
          <button type="button">First action</button>
          {includeFixedAction && (
            <button type="button" style={{ position: 'fixed' }}>
              Fixed action
            </button>
          )}
          <button type="button" hidden>
            Hidden action
          </button>
          <button type="button" style={{ visibility: 'hidden' }}>
            Invisible action
          </button>
          <span aria-hidden="true">
            <button type="button">Decorative action</button>
          </span>
          <button type="button">Last action</button>
        </div>
      )}
    </>
  );
}

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('moves initial focus into the dialog and restores focus to the trigger', () => {
    const onEscape = vi.fn();

    render(<TrapHarness initialFocus="first-tabbable" onEscape={onEscape} />);

    const trigger = screen.getByRole('button', { name: /open dialog/i });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: /first action/i })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: /practice dialog/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('wraps keyboard focus between the first and last visible tabbable controls', () => {
    render(<TrapHarness initialFocus="first-tabbable" includeFixedAction />);

    fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));

    const firstAction = screen.getByRole('button', { name: /first action/i });
    const fixedAction = screen.getByRole('button', { name: /fixed action/i });
    const lastAction = screen.getByRole('button', { name: /last action/i });

    firstAction.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(lastAction).toHaveFocus();

    lastAction.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(firstAction).toHaveFocus();

    expect(fixedAction).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hidden action/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decorative action/i })).not.toBeInTheDocument();
  });

  it('prevents default Escape handling before closing the active dialog', () => {
    const onEscape = vi.fn();
    render(<TrapHarness onEscape={onEscape} />);
    fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps Escape from leaking to later background key handlers', () => {
    const onEscape = vi.fn();
    const backgroundHandler = vi.fn();

    render(<TrapHarness onEscape={onEscape} />);
    fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));
    window.addEventListener('keydown', backgroundHandler);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(backgroundHandler).not.toHaveBeenCalled();

    window.removeEventListener('keydown', backgroundHandler);
  });
});
