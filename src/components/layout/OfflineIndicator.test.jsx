import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseProgressData } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useProgressData: () => mockUseProgressData(),
}));

import { OfflineIndicator } from './OfflineIndicator';

function setNavigatorOnline(value) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.useRealTimers();
    setNavigatorOnline(true);
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      clearSyncFailed: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a local-browser sync warning with only a hide action', () => {
    const clearSyncFailed = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 2,
      clearSyncFailed,
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/2 progress updates could not reach the cloud yet\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your latest work is still available in this browser\./i),
    ).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide sync warning/i });
    expect(hideButton).toBeInTheDocument();
    expect(screen.queryByText(/sync now/i)).not.toBeInTheDocument();

    fireEvent.click(hideButton);
    expect(clearSyncFailed).toHaveBeenCalledTimes(1);
  });

  it('renders the offline banner from the initial browser state', () => {
    setNavigatorOnline(false);

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/you are offline\. you can keep learning in this browser/i),
    ).toBeInTheDocument();
  });

  it('shows a reconnect toast and clears it safely when the network changes again', () => {
    vi.useFakeTimers();
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(
      screen.getByText(/back online\. new progress saves can reach the cloud again\./i),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(
      screen.getByText(/back online\. new progress saves can reach the cloud again\./i),
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(
      screen.queryByText(/back online\. new progress saves can reach the cloud again\./i),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      screen.queryByText(/back online\. new progress saves can reach the cloud again\./i),
    ).not.toBeInTheDocument();
  });
});
