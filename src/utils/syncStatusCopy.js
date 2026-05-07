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
      detail: 'This preview saves in this browser. Sign in to sync lessons, bookmarks, notes, and account progress; rewards stay motivational until backend sync is verified.',
    };
  }

  if (loadError) {
    return {
      tone: 'warning',
      label: 'Cloud progress unavailable',
      detail: 'Your current session is safe, but cloud progress needs retry before account state is confirmed.',
    };
  }

  if (pendingSyncWrites > 0) {
    return {
      tone: syncRetryInFlight ? 'saving' : 'queued',
      label: syncRetryInFlight ? 'Retrying cloud sync' : 'Cloud sync queued',
      detail: syncRetryInFlight
        ? `${pluralizeUpdate(pendingSyncWrites)} retrying now. Your current session stays visible while cloud sync catches up.`
        : `Saved locally. ${pluralizeUpdate(pendingSyncWrites)} will retry cloud sync when you are back online.`,
    };
  }

  if (syncFailed > 0) {
    return {
      tone: 'warning',
      label: 'Sync needs retry',
      detail: 'Your current session is safe, but cloud sync needs retry when the connection is stable.',
    };
  }

  if (marking || mutationState === 'submitting' || mutationState === 'loading') {
    return {
      tone: 'saving',
      label: 'Saving',
      detail: 'Saving this lesson step to your account.',
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
    label: 'Saved',
    detail: 'Lessons, bookmarks, notes, and account progress can sync when the cloud is reachable. Rewards stay motivational until backend sync is verified.',
  };
}
