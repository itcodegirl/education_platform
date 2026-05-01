import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAutoDismissReveal } from './useAutoDismissReveal';

const VISIBLE_MS = 1500;
const FADE_OUT_MS = 400;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderRevealHook(props) {
  return renderHook((p) => useAutoDismissReveal(p), { initialProps: props });
}

describe('useAutoDismissReveal', () => {
  it('flips show=true synchronously when active becomes truthy', () => {
    const onClear = vi.fn();
    const { result } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    expect(result.current.show).toBe(true);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('flips show=false after visibleMs and calls onClear after the fade-out', async () => {
    const onClear = vi.fn();
    const { result } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    // Visible phase
    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS); });
    expect(result.current.show).toBe(false);
    expect(onClear).not.toHaveBeenCalled();

    // Fade-out phase ends -> onClear fires
    await act(async () => { await vi.advanceTimersByTimeAsync(FADE_OUT_MS); });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('dismiss() jumps straight to the fade-out + clear path', async () => {
    const onClear = vi.fn();
    const { result } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    expect(result.current.show).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.show).toBe(false);
    expect(onClear).not.toHaveBeenCalled();

    await act(async () => { await vi.advanceTimersByTimeAsync(FADE_OUT_MS); });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('manual dismiss followed by the auto-dismiss firing only calls onClear once', async () => {
    // This guards the bug the queueing fix was about: two timers
    // (manual + auto) racing close together used to schedule two
    // separate clears, which would shift the queue twice and drop
    // a fresh entry.
    const onClear = vi.fn();
    const { result } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    // Run almost the full visible window, then dismiss manually
    // right before the auto-dismiss timer would fire.
    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS - 50); });
    act(() => result.current.dismiss());
    // The auto-dismiss timer is now scheduled to fire 50ms from now,
    // and dismiss() just scheduled a fresh fade-out timer for 400ms.
    // Run far enough that BOTH would have fired in the buggy version.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FADE_OUT_MS + 100);
    });

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('a new active value cancels the in-flight clear from the previous one', async () => {
    const onClear = vi.fn();
    const { result, rerender } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    // Drive popup A through to the fade-out phase (clear timer
    // scheduled but not yet fired).
    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS); });
    expect(result.current.show).toBe(false);

    // Mid-fade, the queue advances and a new active value lands.
    rerender({ active: { id: 'b' }, visibleMs: VISIBLE_MS, fadeOutMs: FADE_OUT_MS, onClear });

    // The old clear timer should have been cancelled. Advance past
    // when it would have fired (the original schedule was 400ms after
    // visibleMs); onClear must NOT have fired yet, because B is now
    // owning the lifecycle.
    await act(async () => { await vi.advanceTimersByTimeAsync(FADE_OUT_MS); });
    expect(onClear).not.toHaveBeenCalled();
    expect(result.current.show).toBe(true);
  });

  it('cleanup on unmount cancels both visible and fade-out timers', async () => {
    const onClear = vi.fn();
    const { unmount } = renderRevealHook({
      active: { id: 'a' },
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    // Enter the fade-out phase, then unmount before the clear timer
    // fires. onClear must not be called against an unmounted hook.
    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS); });
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(FADE_OUT_MS + 100); });

    expect(onClear).not.toHaveBeenCalled();
  });

  it('does nothing while active is falsy', async () => {
    const onClear = vi.fn();
    const { result } = renderRevealHook({
      active: null,
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    expect(result.current.show).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS + FADE_OUT_MS); });
    expect(onClear).not.toHaveBeenCalled();
  });

  it('flipping active from null to truthy starts a fresh lifecycle', async () => {
    const onClear = vi.fn();
    const { result, rerender } = renderRevealHook({
      active: null,
      visibleMs: VISIBLE_MS,
      fadeOutMs: FADE_OUT_MS,
      onClear,
    });

    expect(result.current.show).toBe(false);

    rerender({ active: { id: 'a' }, visibleMs: VISIBLE_MS, fadeOutMs: FADE_OUT_MS, onClear });
    expect(result.current.show).toBe(true);

    await act(async () => { await vi.advanceTimersByTimeAsync(VISIBLE_MS + FADE_OUT_MS); });
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
