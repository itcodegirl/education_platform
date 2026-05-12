import {
  getProgressSummaryTrustNotice,
  getProgressSyncNotice,
} from '../utils/progressTrust';

export const PROGRESS_SYNC_COPY = getProgressSyncNotice();

export const PROGRESS_SUMMARY_COPY = getProgressSummaryTrustNotice();

// Short, tooltip-sized version of PROGRESS_SYNC_COPY for cramped surfaces
// (e.g. the always-visible topbar pills) where the full sentence does not fit.
export const PROGRESS_SYNC_SHORT =
  'Saved on this device - XP, streaks, badges, review queue, and challenges are single-device today.';
