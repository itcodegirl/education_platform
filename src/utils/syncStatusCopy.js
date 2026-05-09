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
      label: 'Same-device mode',
      detail: 'Create an account to save lessons, bookmarks, and notes to the cloud. XP, streaks, badges, review cards, and challenges stay on this device today.',
    };
  }

  if (loadError) {
    return {
      tone: 'warning',
      label: 'Cloud progress unavailable',
      detail: 'This view is using the current browser session until account progress loads again.',
    };
  }

  if (pendingSyncWrites > 0) {
    return {
      tone: syncRetryInFlight ? 'saving' : 'queued',
      label: syncRetryInFlight ? 'Retrying cloud sync' : 'Cloud sync queued',
      detail: `${pluralizeUpdate(pendingSyncWrites)} waiting in this browser. Keep this tab open when you reconnect.`,
    };
  }

  if (syncFailed > 0) {
    return {
      tone: 'warning',
      label: 'Cloud not confirmed',
      detail: 'Your latest in-tab progress is visible here; retry when the connection is stable.',
    };
  }

  if (marking || mutationState === 'submitting' || mutationState === 'loading') {
    return {
      tone: 'saving',
      label: 'Saving to cloud',
      detail: 'Lesson progress is updating for this account.',
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
    label: 'Account sync ready',
    detail: 'Lessons, bookmarks, and notes save to your account when the cloud is reachable. XP, streaks, badges, review cards, and challenges stay on this device today.',
  };
}
