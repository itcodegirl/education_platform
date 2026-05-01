import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LOCAL_STORAGE_SYNC_ERROR_EVENT, useLocalStorage } from './useLocalStorage';

function StorageWriter() {
  const [, setValue] = useLocalStorage('test-storage-key', 0);
  return (
    <button type="button" onClick={() => setValue(1)}>
      write
    </button>
  );
}

describe('useLocalStorage', () => {
  it('emits a sanitized sync-failure event when localStorage writes fail', () => {
    const handler = vi.fn();
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded');
      });

    window.addEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handler);

    try {
      render(<StorageWriter />);
      fireEvent.click(screen.getByRole('button', { name: /write/i }));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { key: 'test-storage-key', phase: 'write' },
        }),
      );
    } finally {
      window.removeEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handler);
      setItemSpy.mockRestore();
    }
  });
});
