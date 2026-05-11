// Maps Supabase auth error messages to learner-friendly copy. Pure
// helper so it can be unit-tested independently of the auth UI.

export function getFriendlyAuthError(message, fallback) {
  const normalized = (message || '').toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Double-check both and try again.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email first, then sign in.';
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'An account already exists for this email. Try logging in instead.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts right now. Wait a minute, then try again.';
  }
  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Connection failed. Check your internet and try again.';
  }
  if (
    normalized.includes('accounts are not connected') ||
    normalized.includes('missing supabase') ||
    normalized.includes('missing_supabase_config')
  ) {
    return 'Accounts are not connected in this environment. You can still preview the first lesson.';
  }
  return message || fallback;
}
