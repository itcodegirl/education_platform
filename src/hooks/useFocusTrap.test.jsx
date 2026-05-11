import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

function TrapHarness({ onEscape, initialFocus = 'container' }) {
  const ref = useRef(null);
  useFocusTrap(ref, { enabled: true, onEscape, initialFocus });

  return (
    <div ref={ref} tabIndex={-1}>
      <button type="button">First action</button>
      <button type="button" style={{ position: 'fixed' }}>Fixed action</button>
    </div>
  );
}

function FocusRestoreHarness({ showTrap }) {
  return (
    <>
      <button type="button">Open tools</button>
      {showTrap && <TrapHarness initialFocus="first-tabbable" />}
    </>
  );
}

describe('useFocusTrap', () => {
  it('prevents default Escape handling before closing the active dialog', () => {
    const onEscape = vi.fn();
    render(<TrapHarness onEscape={onEscape} />);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('wraps focus through fixed-position controls inside the dialog', () => {
    render(<TrapHarness />);

    const first = screen.getByRole('button', { name: /first action/i });
    const last = screen.getByRole('button', { name: /fixed action/i });
    first.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(last).toHaveFocus();
  });

  it('restores focus to the opener when the dialog unmounts', () => {
    const { rerender } = render(<FocusRestoreHarness showTrap={false} />);

    const opener = screen.getByRole('button', { name: /open tools/i });
    opener.focus();

    rerender(<FocusRestoreHarness showTrap />);
    rerender(<FocusRestoreHarness showTrap={false} />);

    expect(opener).toHaveFocus();
  });
});
