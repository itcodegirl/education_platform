// Post-signup confirmation screen. Shown after the signUp service
// returns success but before the learner has clicked the email link.
// Owns only the local "resend" interaction; AuthPage owns email/mode state.

import { useState } from 'react';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Logo } from '../shared/Logo';
import { getFriendlyAuthError } from './authErrorMessages';

export function AuthConfirmSent({ email, onBack, onResend, onPreview }) {
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendMessage, setResendMessage] = useState('');
  // Signup normalizes the address (trims whitespace) before creating the
  // account, so the resend must use the same normalized value or it can
  // fail for pasted / whitespace-padded emails.
  const normalizedEmail = (email || '').trim();

  const handleResend = async () => {
    if (!onResend || resendState === 'sending') return;
    setResendState('sending');
    setResendMessage('');
    try {
      const { error } = await onResend(normalizedEmail);
      if (error) {
        setResendState('error');
        setResendMessage(getFriendlyAuthError(error?.message, 'Could not resend just now. Wait a minute, then try again.'));
        return;
      }
      setResendState('sent');
      setResendMessage('Sent. Check your inbox (and spam) again.');
    } catch (err) {
      setResendState('error');
      setResendMessage(getFriendlyAuthError(err?.message, 'Could not resend just now. Wait a minute, then try again.'));
    }
  };

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
            We sent a confirmation link to <strong>{normalizedEmail}</strong>. Open it to activate your account.
          </p>
          {onResend && (
            <p className="auth-confirm-resend">
              Didn&apos;t get it? Check your spam folder, or{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResend}
                disabled={resendState === 'sending'}
              >
                {resendState === 'sending' ? 'resending…' : 'resend the link'}
              </button>
              .
            </p>
          )}
          {resendMessage && (
            <p
              className={`auth-confirm-resend-status ${resendState === 'error' ? 'is-error' : 'is-ok'}`}
              role="status"
              aria-live="polite"
            >
              {resendMessage}
            </p>
          )}
          <button
            type="button"
            className="auth-submit ui-btn ui-btn-primary"
            onClick={onBack}
            aria-label="Return to login after confirming your account"
          >
            Back to login
          </button>
          {onPreview && (
            <p className="auth-confirm-preview">
              You can keep exploring the{' '}
              <button type="button" className="auth-link-btn" onClick={onPreview}>
                first lesson
              </button>{' '}
              while you wait.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
