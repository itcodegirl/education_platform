// ═══════════════════════════════════════════════
// EMAIL VERIFICATION BANNER — Subtle reminder
// Shows when user.email_confirmed_at is null
// Dismissable for the session
// ═══════════════════════════════════════════════

import { useState, memo } from 'react';
import { useAuth } from '../../providers';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

export const EmailVerifyBanner = memo(function EmailVerifyBanner() {
  const { user, resendConfirmation } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  if (dismissed) return null;
  if (!user) return null;
  if (user.email_confirmed_at) return null;

  const handleResend = async () => {
    if (resendStatus === 'sending' || resendStatus === 'sent') return;
    setResendStatus('sending');
    const { error } = await resendConfirmation(user.email);
    setResendStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="verify-banner" role="alert">
      <span className="verify-icon" aria-hidden="true">📧</span>
      <span className="verify-text">
        Please verify your email so connected lesson completions and bookmarks can sync.
        Check your inbox for the confirmation link. {PROGRESS_SYNC_COPY}
      </span>
      <button
        type="button"
        className="verify-resend"
        onClick={handleResend}
        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
        aria-disabled={resendStatus === 'sending' || resendStatus === 'sent' ? 'true' : undefined}
      >
        {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? 'Email sent ✓' : 'Resend email'}
      </button>
      {resendStatus === 'error' && (
        <span className="verify-resend-error" role="status">
          Couldn't send — try again.
        </span>
      )}
      <button
        type="button"
        className="verify-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
});
