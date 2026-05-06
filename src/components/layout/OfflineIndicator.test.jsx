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
      loadWarnings: [],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
      retryLoad: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('renders a retry banner when queued progress writes are pending', () => {
    const retryPendingSyncWrites = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 2,
      syncRetryInFlight: false,
      loadWarnings: [],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites,
      retryLoad: vi.fn(),
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

  it('copy.single-device-warning-visible-when-backend-sync-disabled', () => {
    vi.stubEnv('VITE_REWARD_BACKEND_SYNC_ENABLED', 'false');
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 1,
      syncRetryInFlight: false,
      clearSyncFailed: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/one progress update is queued to retry\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your latest in-tab progress is still here\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cross-device/i)).not.toBeInTheDocument();
  });

  it('announces when queued progress writes are actively retrying', () => {
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 1,
      syncRetryInFlight: true,
      loadWarnings: [],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
      retryLoad: vi.fn(),
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

  it('surfaces failed retry context while queued progress writes remain pending', () => {
    mockUseProgressData.mockReturnValue({
      syncFailed: 1,
      pendingSyncWrites: 1,
      syncRetryInFlight: false,
      loadWarnings: [],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
      retryLoad: vi.fn(),
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/one progress update is queued to retry\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/last retry could not reach the cloud\. your latest in-tab progress is still here\./i),
    ).toBeInTheDocument();
  });

  it('renders a local-session sync warning with only a hide action', () => {
    const clearSyncFailed = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 2,
      pendingSyncWrites: 0,
      syncRetryInFlight: false,
      loadWarnings: [],
      clearSyncFailed,
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
      retryLoad: vi.fn(),
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

  it('renders scoped recoverable load warnings without blocking the app shell', () => {
    const clearLoadWarnings = vi.fn();
    const retryLoad = vi.fn();
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 0,
      syncRetryInFlight: false,
      loadWarnings: ['Notes failed to load.', 'Badges failed to load.'],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings,
      retryPendingSyncWrites: vi.fn(),
      retryLoad,
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText(/notes failed to load\. badges failed to load\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/core lessons still loaded in this browser\./i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry progress load/i }));
    fireEvent.click(screen.getByRole('button', { name: /hide load warnings/i }));

    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(clearLoadWarnings).toHaveBeenCalledTimes(1);
  });

  it('renders the offline banner from the initial browser state', () => {
    setNavigatorOnline(false);
    mockUseProgressData.mockReturnValue({
      syncFailed: 0,
      pendingSyncWrites: 1,
      syncRetryInFlight: false,
      loadWarnings: [],
      clearSyncFailed: vi.fn(),
      clearLoadWarnings: vi.fn(),
      retryPendingSyncWrites: vi.fn(),
      retryLoad: vi.fn(),
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
