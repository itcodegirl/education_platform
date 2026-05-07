function normalizeLoadWarningMessage(warning) {
  if (!warning || typeof warning.message !== 'string') return '';
  const message = warning.message.trim();
  return message || '';
}

export function collectRecoverableLoadWarnings(recoverableErrors = {}) {
  return Object.values(recoverableErrors || {})
    .map((warning) => normalizeLoadWarningMessage(warning))
    .filter(Boolean);
}
