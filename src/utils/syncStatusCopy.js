function pluralizeUpdate(count) {
  return count === 1 ? '1 update' : `${count} updates`;
}

export function getSyncStatusCopy({
  user,
  dataLoaded = false,
  loadError = null,
  pendingSyncWrites = 0,
  syncFailed = 0,
  syncRetryInFlight = false,
  marking = false,
  mutationState = 'idle',
} = {}) {
  if (!user) {
    return {
      tone: 'local',
      label: 'Saved locally',
      detail: 'This browser keeps your lesson place. Sign in to sync lessons, bookmarks, and notes across devices.',
    };
  }

  if (loadError) {
    return {
      tone: 'warning',
      label: 'Cloud progress unavailable',
      detail: 'Your current session is safe, but cloud sync needs retry before account progress is confirmed.',
    };
  }

  if (pendingSyncWrites > 0) {
    return {
      tone: syncRetryInFlight ? 'saving' : 'queued',
      label: syncRetryInFlight ? 'Retrying cloud sync' : 'Cloud sync queued',
      detail: syncRetryInFlight
        ? `${pluralizeUpdate(pendingSyncWrites)} retrying now. Keep this tab open while cloud sync catches up.`
        : `Saved in this browser. We will retry ${pluralizeUpdate(pendingSyncWrites)} when you are back online.`,
      actionLabel: syncRetryInFlight ? '' : 'Retry now',
      actionAriaLabel: syncRetryInFlight ? '' : 'Retry queued progress updates now',
    };
  }

  if (syncFailed > 0) {
    const retryVerb = syncFailed === 1 ? 'needs' : 'need';
    return {
      tone: 'warning',
      label: 'Sync needs retry',
      detail: `${pluralizeUpdate(syncFailed)} saved in this browser ${retryVerb} another cloud sync attempt when the connection is stable.`,
      actionLabel: 'Retry now',
      actionAriaLabel: 'Retry failed progress sync now',
    };
  }

  if (marking || mutationState === 'submitting' || mutationState === 'loading') {
    return {
      tone: 'saving',
      label: 'Saving to account',
      detail: 'Saving this lesson reading step to your account.',
    };
  }

  if (!dataLoaded) {
    return {
      tone: 'checking',
      label: 'Checking sync',
      detail: 'Loading your account progress before showing saved state.',
    };
  }

  return {
    tone: 'synced',
    label: 'Saved to account',
    detail: 'Latest account sync looks current. New lesson activity will sync when the cloud is reachable.',
  };
}
