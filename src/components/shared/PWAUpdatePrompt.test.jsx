import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PWAUpdatePrompt } from './PWAUpdatePrompt';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PWAUpdatePrompt', () => {
  it('shows a refresh prompt when the service worker reports an update', async () => {
    const receivedActivations = [];
    const handleActivate = (event) => receivedActivations.push(event.detail);
    const updateDetail = {
      registration: { waiting: { postMessage: vi.fn() } },
      reason: 'installed-update',
    };

    window.addEventListener('codeherway:sw-activate-waiting', handleActivate);
    render(<PWAUpdatePrompt />);

    window.dispatchEvent(new CustomEvent('codeherway:sw-update-ready', { detail: updateDetail }));

    expect(await screen.findByText(/fresh lessons are ready/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(receivedActivations).toEqual([updateDetail]);
    expect(screen.getByRole('button', { name: /refreshing/i })).toBeDisabled();

    window.removeEventListener('codeherway:sw-activate-waiting', handleActivate);
  });

  it('lets the learner dismiss the update prompt', async () => {
    render(<PWAUpdatePrompt />);

    window.dispatchEvent(new CustomEvent('codeherway:sw-update-ready', {
      detail: { registration: {} },
    }));

    expect(await screen.findByText(/fresh lessons are ready/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /later/i }));

    expect(screen.queryByText(/fresh lessons are ready/i)).not.toBeInTheDocument();
  });
});
