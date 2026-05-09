import { describe, expect, it } from 'vitest';
import { getSyncStatusCopy } from './syncStatusCopy';

describe('getSyncStatusCopy', () => {
  const user = { id: 'learner-1' };

  it('does not claim cloud sync when the learner is not signed in', () => {
    expect(getSyncStatusCopy({ user: null })).toEqual({
      tone: 'local',
      label: 'Same-device mode',
      detail: 'Sign in to sync lessons, bookmarks, notes, XP, and streaks across devices.',
    });
  });

  it('shows queued browser writes before the ready state', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, pendingSyncWrites: 2 })).toEqual({
      tone: 'queued',
      label: 'Cloud sync queued',
      detail: '2 updates waiting in this browser. Keep this tab open when you reconnect.',
    });
  });

  it('progressSaveFailureShowsRecoveryMessage', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, syncFailed: 1 })).toEqual({
      tone: 'warning',
      label: 'Cloud not confirmed',
      detail: 'Your latest in-tab progress is visible here; retry when the connection is stable.',
    });
  });

  it('shows an active saving state while mark-done is submitting', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true, mutationState: 'submitting' })).toEqual({
      tone: 'saving',
      label: 'Saving to cloud',
      detail: 'Lesson progress is updating for this account.',
    });
  });

  it('names the normal account sync scope honestly', () => {
    expect(getSyncStatusCopy({ user, dataLoaded: true })).toEqual({
      tone: 'synced',
      label: 'Account sync ready',
      detail: 'Lessons, bookmarks, notes, XP, and streaks save to your account when the cloud is reachable.',
    });
  });
});
