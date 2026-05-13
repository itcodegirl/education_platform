export const PROGRESS_TRUST_SCOPES = Object.freeze({
  LOCAL: 'local',
  ACCOUNT: 'account',
  VERIFIED: 'verified',
});

const TRUST_COPY = Object.freeze({
  [PROGRESS_TRUST_SCOPES.LOCAL]: Object.freeze({
    label: 'Saved on this device',
    detail: 'XP, streaks, badges, review queue, and challenges are single-device today.',
  }),
  [PROGRESS_TRUST_SCOPES.ACCOUNT]: Object.freeze({
    label: 'Account sync when connected',
    detail: 'Lesson completions, bookmarks, and notes may sync to your account when the cloud is reachable.',
  }),
  [PROGRESS_TRUST_SCOPES.VERIFIED]: Object.freeze({
    label: 'Verified completion evidence',
    detail: 'Requires server-backed completion and reward records before CodeHerWay presents a credential.',
  }),
});

export function getProgressTrustCopy(scope = PROGRESS_TRUST_SCOPES.LOCAL) {
  return TRUST_COPY[scope] || TRUST_COPY[PROGRESS_TRUST_SCOPES.LOCAL];
}

export function getProgressSyncNotice() {
  const local = getProgressTrustCopy(PROGRESS_TRUST_SCOPES.LOCAL);
  const account = getProgressTrustCopy(PROGRESS_TRUST_SCOPES.ACCOUNT);

  return `Progress sync: saved on this device. ${account.detail} ${local.detail}`;
}

export function getProgressSummaryTrustNotice() {
  const verified = getProgressTrustCopy(PROGRESS_TRUST_SCOPES.VERIFIED);

  return `This Progress Summary reflects current app progress and is not server-authoritative yet. ${verified.detail}`;
}
