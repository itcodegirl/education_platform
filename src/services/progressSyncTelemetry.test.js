import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn(),
}));

vi.mock('../lib/analytics', () => ({
  trackEvent: mockTrackEvent,
}));

import {
  trackProgressSyncFailure,
  trackProgressSyncQueued,
  trackProgressSyncReplay,
} from './progressSyncTelemetry';

describe('progressSyncTelemetry', () => {
  beforeEach(() => {
    mockTrackEvent.mockReset();
  });

  it('tracks queued progress writes without leaking payload identifiers', () => {
    trackProgressSyncQueued({
      operation: 'addLesson',
      label: 'lesson progress',
      queueSize: 2,
      lessonKey: 'should-not-be-forwarded',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('progress_sync_queued', {
      operation: 'addLesson',
      label: 'lesson progress',
      queueSize: 2,
    });
  });

  it('tracks successful replay summaries', () => {
    trackProgressSyncReplay({
      trigger: 'online',
      processed: 3,
      remaining: 0,
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('progress_sync_replay', {
      trigger: 'online',
      status: 'completed',
      processed: 3,
      remaining: 0,
      errorName: '',
    });
  });

  it('tracks failed replay summaries without raw error messages or payloads', () => {
    trackProgressSyncReplay({
      trigger: 'manual',
      processed: 1,
      remaining: 2,
      failedItem: {
        operation: 'saveNote',
        label: 'lesson note',
        attemptCount: 4,
        payload: {
          lessonKey: 'private-lesson-key',
          content: 'private note',
        },
        lastError: 'raw database message',
      },
      error: new TypeError('private network detail'),
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('progress_sync_replay', {
      trigger: 'manual',
      status: 'failed',
      processed: 1,
      remaining: 2,
      errorName: 'TypeError',
      failedOperation: 'saveNote',
      failedLabel: 'lesson note',
      failedAttemptCount: 4,
    });
  });

  it('tracks visible sync failures by coarse source only', () => {
    trackProgressSyncFailure({
      label: 'reward event processor:quiz:html-intro-private-key',
      pendingCount: 3,
      lessonKey: 'private-lesson-key',
      rawError: 'database detail',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('progress_sync_failure_visible', {
      source: 'reward_event',
      pendingCount: 3,
    });
  });

  it('classifies localStorage write failures without exposing the storage key', () => {
    trackProgressSyncFailure({
      label: 'localStorage write:chw-tasks',
      pendingCount: 2,
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('progress_sync_failure_visible', {
      source: 'local_storage',
      pendingCount: 2,
    });
  });
});
