function toError(value) {
  if (!value) return null;
  if (value instanceof Error) return value;

  const message =
    typeof value.message === 'string' && value.message.trim()
      ? value.message.trim()
      : typeof value.details === 'string' && value.details.trim()
        ? value.details.trim()
        : 'Unknown progress write failure';

  const error = new Error(message);
  if (typeof value.code === 'string' || typeof value.code === 'number') {
    error.code = value.code;
  }
  if (typeof value.status === 'number') {
    error.status = value.status;
  }
  return error;
}

export function getProgressWriteFailure(result) {
  if (!result) return null;
  if (result instanceof Error) return result;
  if (typeof result !== 'object' || !('error' in result)) return null;
  return toError(result.error);
}
