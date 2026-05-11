// Post-signup confirmation screen. Shown after the signUp service
// returns success but before the learner has clicked the email link.
// Pure presentational; the parent AuthPage owns the email/mode state.

import { ThemeToggle } from '../layout/ThemeToggle';
import { Logo } from '../shared/Logo';

export function AuthConfirmSent({ email, onBack }) {
  return (
    <main className="auth-page" id="top">
      <div className="auth-theme-toggle-wrap">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          <Logo size="lg" showTagline />
        </div>
        <div className="auth-confirm" role="status" aria-live="polite">
          <span className="auth-confirm-icon" aria-hidden="true">📧</span>
          <h1>Check your email</h1>
          <p>
            We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account.
          </p>
          <button
            type="button"
            className="auth-submit ui-btn ui-btn-primary"
            onClick={onBack}
            aria-label="Return to login after confirming your account"
          >
            Back to login
          </button>
        </div>
      </div>
    </main>
  );
}
