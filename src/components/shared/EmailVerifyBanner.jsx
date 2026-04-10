// ═══════════════════════════════════════════════
// EMAIL VERIFICATION BANNER — Subtle reminder
// Shows when user.email_confirmed_at is null
// Dismissable for the session
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { useAuth } from '../../providers';

export function EmailVerifyBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!user) return null;
  if (user.email_confirmed_at) return null;

  return (
    <div className="verify-banner" role="alert">
      <span className="verify-icon">📧</span>
      <span className="verify-text">
        Please verify your email to save your progress across devices.
        Check your inbox for the confirmation link.
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
}
