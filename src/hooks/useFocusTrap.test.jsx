import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

function TrapHarness({ onEscape }) {
  const ref = useRef(null);
  useFocusTrap(ref, { enabled: true, onEscape });

  return (
    <div ref={ref} tabIndex={-1}>
      <button type="button">Inside dialog</button>
    </div>
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
});
