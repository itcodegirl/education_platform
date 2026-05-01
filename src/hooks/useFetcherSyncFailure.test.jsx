import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useFetcherSyncFailure } from './useFetcherSyncFailure';

function FetcherFailureProbe({ fetcher, markSyncFailed, enqueuePendingSyncWrite = () => false }) {
  useFetcherSyncFailure(
    fetcher,
    { markSyncFailed, enqueuePendingSyncWrite },
    'lesson progress',
  );
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

  it('queues recoverable route failures instead of surfacing a generic sync warning', () => {
    const markSyncFailed = vi.fn();
    const enqueuePendingSyncWrite = vi.fn(() => true);

    render(
      <FetcherFailureProbe
        fetcher={{
          data: {
            ok: false,
            intent: 'toggle-progress',
            error: 'DB unavailable',
            recoverableWrite: {
              operation: 'addLesson',
              payload: { lessonKey: 'c:html|m:m-basics|l:l-intro' },
            },
          },
        }}
        markSyncFailed={markSyncFailed}
        enqueuePendingSyncWrite={enqueuePendingSyncWrite}
      />,
    );

    expect(enqueuePendingSyncWrite).toHaveBeenCalledWith(
      {
        operation: 'addLesson',
        payload: { lessonKey: 'c:html|m:m-basics|l:l-intro' },
      },
      'lesson progress: DB unavailable',
    );
    expect(markSyncFailed).not.toHaveBeenCalled();
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
