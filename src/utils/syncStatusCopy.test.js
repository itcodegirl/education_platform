import { describe, expect, it } from 'vitest';
import { getSyncStatusCopy } from './syncStatusCopy';

describe('getSyncStatusCopy', () => {
  const user = { id: 'learner-1' };

  it('does not claim cloud sync when the learner is not signed in', () => {
    expect(getSyncStatusCopy({ user: null })).toEqual({
      tone: 'local',
      label: 'Saved locally',
      detail: 'This preview saves in this browser. Sign in to sync lessons, bookmarks, notes, XP, and streaks.',
    });
  });

  it('shows queued browser writes before the ready state', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 2 })).toEqual({
      tone: 'queued',
      label: 'Cloud sync queued',
      detail: 'Saved locally. 2 updates will retry cloud sync when you are back online.',
    });
  });

  it('syncStatusCopyCoversPendingRetryAndFailure', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 1, syncRetryInFlight: true })).toEqual({
      tone: 'saving',
      label: 'Retrying cloud sync',
      detail: '1 update retrying now. Your current session stays visible while cloud sync catches up.',
    });

    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 1 })).toEqual({
      tone: 'warning',
      label: 'Sync needs retry',
      detail: 'Your current session is safe, but cloud sync needs retry when the connection is stable.',
    });
  });

  it('shows an active saving state while mark-done is submitting', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, mutationState: 'submitting' })).toEqual({
      tone: 'saving',
      label: 'Saving',
      detail: 'Saving this lesson step to your account.',
    });
  });

  it('names the normal account sync scope honestly', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true })).toEqual({
      tone: 'synced',
      label: 'Saved',
      detail: 'Progress can sync to this account when the cloud is reachable.',
    });
  });
});
