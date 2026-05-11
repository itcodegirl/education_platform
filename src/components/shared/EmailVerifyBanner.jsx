// ═══════════════════════════════════════════════
// EMAIL VERIFICATION BANNER — Subtle reminder
// Shows when user.email_confirmed_at is null
// Dismissable for the session
// ═══════════════════════════════════════════════

import { useState, memo } from 'react';
import { useAuth } from '../../providers';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

export const EmailVerifyBanner = memo(function EmailVerifyBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!user) return null;
  if (user.email_confirmed_at) return null;

  return (
    <div className="verify-banner" role="alert">
      <span className="verify-icon" aria-hidden="true">📧</span>
      <span className="verify-text">
        Please verify your email so connected lesson completions and bookmarks can sync.
        Check your inbox for the confirmation link. {PROGRESS_SYNC_COPY}
      </span>
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
