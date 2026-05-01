import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useFetcherSyncFailure } from './useFetcherSyncFailure';

function FetcherFailureProbe({ fetcher, markSyncFailed }) {
  useFetcherSyncFailure(fetcher, markSyncFailed, 'lesson progress');
  return null;
}

describe('useFetcherSyncFailure', () => {
  it('marks sync failure when a route action reports ok=false', () => {
    const markSyncFailed = vi.fn();

    render(
      <FetcherFailureProbe
        fetcher={{ data: { ok: false, intent: 'toggle-progress', error: 'DB unavailable' } }}
        markSyncFailed={markSyncFailed}
      />,
    );

    expect(markSyncFailed).toHaveBeenCalledWith('lesson progress: DB unavailable');
  });

  it('ignores successful route action responses', () => {
    const markSyncFailed = vi.fn();

    render(
      <FetcherFailureProbe
        fetcher={{ data: { ok: true, intent: 'toggle-progress' } }}
        markSyncFailed={markSyncFailed}
      />,
    );

    expect(markSyncFailed).not.toHaveBeenCalled();
  });
});
