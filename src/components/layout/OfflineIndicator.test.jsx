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
      pendingSyncWrites: 0,
      syncRetryInFlight: false,
      clearSyncFailed: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a retry banner when queued progress writes are pending', () => {
    const retryPendingSyncWrites = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 2,
      syncRetryInFlight: false,
      clearSyncFailed: vi.fn(),
      retryPendingSyncWrites,
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/2 progress updates are queued to retry\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your latest in-tab progress is still here\./i),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry queued progress updates now/i });
    expect(retryButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hide sync warning/i })).not.toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(retryPendingSyncWrites).toHaveBeenCalledTimes(1);
  });

  it('announces when queued progress writes are actively retrying', () => {
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 1,
      syncRetryInFlight: true,
      clearSyncFailed: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
    });

    render(<OfflineIndicator />);

    const retryBanner = screen.getByRole('alert');
    expect(retryBanner).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByText(/one progress update is retrying now\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/keep this tab open while the cloud sync catches up\./i),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retrying queued progress updates/i });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveTextContent(/retrying/i);
  });

  it('renders a local-session sync warning with only a hide action', () => {
    const clearSyncFailed = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 2,
      pendingSyncWrites: 0,
      syncRetryInFlight: false,
      clearSyncFailed,
      retryPendingSyncWrites: vi.fn(),
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/2 progress updates could not be confirmed in the cloud\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your latest local state is still visible in this browser session\./i),
    ).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide sync warning/i });
    expect(hideButton).toBeInTheDocument();
    expect(screen.queryByText(/sync now/i)).not.toBeInTheDocument();

    fireEvent.click(hideButton);
    expect(clearSyncFailed).toHaveBeenCalledTimes(1);
  });

  it('renders the offline banner from the initial browser state', () => {
    setNavigatorOnline(false);
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 1,
      syncRetryInFlight: false,
      clearSyncFailed: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/you are offline\. one progress update is queued in this browser/i),
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
