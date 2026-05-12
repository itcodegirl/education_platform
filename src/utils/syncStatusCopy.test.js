import { describe, expect, it } from 'vitest';
import { getSyncStatusCopy } from './syncStatusCopy';

describe('getSyncStatusCopy', () => {
  const user = { id: 'learner-1' };

  it('does not claim cloud sync when the learner is not signed in', () => {
    expect(getSyncStatusCopy({ user: null })).toEqual({
      tone: 'local',
      label: 'Saved locally',
      detail: 'This browser keeps your lesson place. Sign in to sync lessons, bookmarks, and notes across devices.',
    });
  });

  it('shows queued browser writes before the ready state', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 2 })).toEqual({
      tone: 'queued',
      label: 'Cloud sync queued',
      detail: 'Saved in this browser. We will retry 2 updates when you are back online.',
      actionLabel: 'Retry now',
      actionAriaLabel: 'Retry queued progress updates now',
    });
  });

  it('shows active retry copy while queued writes are replaying', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 1, syncRetryInFlight: true })).toEqual({
      tone: 'saving',
      label: 'Retrying cloud sync',
      detail: '1 update retrying now. Keep this tab open while cloud sync catches up.',
      actionLabel: '',
      actionAriaLabel: '',
    });
  });

  it('gives failed sync writes a visible recovery action', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 1 })).toEqual({
      tone: 'warning',
      label: 'Sync needs retry',
      detail: '1 update saved in this browser needs another cloud sync attempt when the connection is stable.',
      actionLabel: 'Retry now',
      actionAriaLabel: 'Retry failed progress sync now',
    });
  });

  it('keeps account-load failures distinct from queued write failures', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, loadError: new Error('offline') })).toEqual({
      tone: 'warning',
      label: 'Cloud progress unavailable',
      detail: 'Your current session is safe, but cloud sync needs retry before account progress is confirmed.',
    });
  });

  it('pluralizes failed sync recovery copy', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 2 })).toEqual({
      tone: 'warning',
      label: 'Sync needs retry',
      detail: '2 updates saved in this browser need another cloud sync attempt when the connection is stable.',
      actionLabel: 'Retry now',
      actionAriaLabel: 'Retry failed progress sync now',
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
      detail: 'Latest account sync looks current. New lesson activity will sync when the cloud is reachable.',
    });
  });
});
