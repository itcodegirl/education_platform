import { describe, expect, it } from 'vitest';
import { getSyncStatusCopy } from './syncStatusCopy';

describe('getSyncStatusCopy', () => {
  const user = { id: 'learner-1' };

  it('does not claim cloud sync when the learner is not signed in', () => {
    expect(getSyncStatusCopy({ user: null })).toEqual({
      tone: 'local',
      label: 'Saved locally',
      detail: 'This preview saves in this browser. Sign in to sync lessons, bookmarks, notes, and account progress; rewards remain motivational until backend sync is verified.',
    });
  });

  it('shows queued browser writes before the ready state', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 2 })).toEqual({
      tone: 'queued',
      label: 'Cloud sync queued',
      detail: 'Saved locally. We will retry 2 updates when you are back online.',
      actionLabel: 'Retry now',
      actionAriaLabel: 'Retry queued progress updates now',
    });
  });

  it('syncStatusCopyCoversPendingRetryAndFailure', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 1, syncRetryInFlight: true })).toEqual({
      tone: 'saving',
      label: 'Retrying cloud sync',
      detail: '1 update retrying now. Your current session stays visible while cloud sync catches up.',
      actionLabel: '',
      actionAriaLabel: '',
    });

    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 1 })).toEqual({
      tone: 'warning',
      label: 'Sync needs retry',
      detail: 'Your current session is safe, but cloud sync needs another try when the connection is stable.',
    });

    expect(getSyncStatusCopy({ user, dataLoaded: true, loadError: new Error('offline') })).toEqual({
      tone: 'warning',
      label: 'Cloud progress unavailable',
      detail: 'Your current session is safe, but cloud sync needs retry before account progress is confirmed.',
    });
  });

  it('progressSaveFailureShowsRecoveryMessage', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 2 })).toEqual({
      tone: 'warning',
      label: 'Sync needs retry',
      detail: 'Your current session is safe, but cloud sync needs another try when the connection is stable.',
    });
  });

  it('shows an active saving state while mark-done is submitting', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, mutationState: 'submitting' })).toEqual({
      tone: 'saving',
      label: 'Saving to account',
      detail: 'Saving this lesson reading step to your account.',
    });
  });

  it('names the normal account sync scope honestly', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true })).toEqual({
      tone: 'synced',
      label: 'Saved to account',
      detail: 'Lessons, bookmarks, notes, and account progress are ready to sync when the cloud is reachable. Rewards remain motivational until backend sync is verified.',
    });
  });
});
