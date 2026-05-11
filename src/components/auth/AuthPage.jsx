import { useRef, useState } from 'react';
import { useAuth } from '../../providers';
import { ThemeToggle } from '../layout/ThemeToggle';
import { LandingHeroIntro, LandingHeroStory } from './LandingHero';
import { AuthConfirmSent } from './AuthConfirmSent';
import { AuthSocialButtons } from './AuthSocialButtons';
import { getFriendlyAuthError } from './authErrorMessages';

const PASSWORD_MIN_LENGTH = 8;
const DISPLAY_NAME_MAX_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ onPreview }) {
  const {
    signIn,
    signUp,
    signInWithGithub,
    signInWithGoogle,
    forgotPassword,
    authBackendReady = true,
  } = useAuth();
  const [mode, setMode] = useState('signup'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    displayName: false,
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const authCardRef = useRef(null);
  const emailRef = useRef(null);
  const displayNameRef = useRef(null);

  const focusPrimaryAuthField = (nextMode) => {
    const fieldRef = nextMode === 'signup' ? displayNameRef : emailRef;
    fieldRef.current?.focus();
  };

  const setModeAndClearError = (nextMode) => {
    setMode(nextMode);
    setError('');
    setInfo('');
    setTouched({ email: false, password: false, displayName: false });
    window.requestAnimationFrame(() => {
      focusPrimaryAuthField(nextMode);
    });
  };

  const scrollToAuth = (nextMode) => {
    if (nextMode) {
      setModeAndClearError(nextMode);
    }
    // On desktop the card is already in the first viewport - scroll is a
    // no-op. On mobile it scrolls the form into view. Either way, focus
    // the primary field so keyboard users land in the right place.
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Defer focus until after the smooth scroll settles.
    window.setTimeout(() => {
      focusPrimaryAuthField(nextMode);
    }, 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!authBackendReady) {
      setError('Accounts are not connected in this environment. You can still preview the first lesson.');
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setTouched((prev) => ({ ...prev, email: true }));
      setError('Enter a valid email address to continue.');
      emailRef.current?.focus();
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setTouched((prev) => ({ ...prev, password: true }));
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    if (mode === 'signup' && !normalizedDisplayName) {
      setTouched((prev) => ({ ...prev, displayName: true }));
      setError('Display name is required.');
      displayNameRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(normalizedEmail, password, normalizedDisplayName);
        if (err) {
          setError(getFriendlyAuthError(err.message, 'Unable to create your account right now.'));
        } else {
          setConfirmSent(true);
        }
      } else {
        const { error: err } = await signIn(normalizedEmail, password);
        if (err) {
          setError(getFriendlyAuthError(err.message, 'Unable to sign in right now.'));
        }
      }
    } catch {
      setError('Connection failed. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!authBackendReady) {
      setError('Password reset is unavailable because accounts are not connected in this environment.');
      setInfo('');
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your email first, then select Forgot password.');
      setInfo('');
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setTouched((prev) => ({ ...prev, email: true }));
      setError('Enter a valid account email, then select Forgot password.');
      setInfo('');
      emailRef.current?.focus();
      return;
    }

    setError('');
    setInfo('');
    setSendingReset(true);
    try {
      const { error: err } = await forgotPassword(normalizedEmail);
      if (err) {
        setError(getFriendlyAuthError(err.message, 'Unable to send a reset link right now.'));
      } else {
        setInfo(`Password reset link sent to ${normalizedEmail}. Check your inbox and spam folder. The link expires for security.`);
      }
    } catch {
      setError('Unable to send a reset link right now.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSocialSignIn = async (providerName, signInWithProvider) => {
    setError('');
    setInfo('');

    if (!authBackendReady) {
      setError(`Unable to continue with ${providerName} because accounts are not connected in this environment.`);
      return;
    }

    setSocialLoading(providerName);

    try {
      const { error: err } = await signInWithProvider();
      if (err) {
        setError(getFriendlyAuthError(
          err.message,
          `Unable to continue with ${providerName} right now. Try email sign-in or try again in a moment.`
        ));
      } else {
        setInfo(`Opening ${providerName} sign-in...`);
      }
    } catch {
      setError(`Unable to continue with ${providerName} right now. Try email sign-in or try again in a moment.`);
    } finally {
      setSocialLoading('');
    }
  };

  const emailInlineError = (touched.email || email.trim().length >= 3) && email.trim() && !EMAIL_PATTERN.test(email.trim())
    ? 'Enter a valid email format (example: you@example.com).'
    : '';
  const remainingPasswordChars = Math.max(PASSWORD_MIN_LENGTH - password.length, 0);
  const passwordInlineError = password.length > 0 && password.length < PASSWORD_MIN_LENGTH
    ? `${password.length}/${PASSWORD_MIN_LENGTH} characters. Add ${remainingPasswordChars} more to continue.`
    : '';
  const displayNameInlineError = mode === 'signup' && touched.displayName && !displayName.trim()
    ? 'Display name is required.'
    : '';
  const isAuthBusy = loading || sendingReset || Boolean(socialLoading);
  const authDisabled = !authBackendReady;

  if (confirmSent) {
    return (
      <AuthConfirmSent
        email={email}
        onBack={() => {
          setConfirmSent(false);
          setMode('login');
        }}
      />
    );
  }

  return (
    <main className="auth-page auth-with-hero" id="top">
      <div className="auth-theme-toggle-wrap">
        <ThemeToggle />
      </div>
      {/* Above the fold: intro on the left, auth card on the right.
          LandingHeroIntro provides the single <h1> for this page. The
          auth card's brand row is intentionally not an extra <h1> so the
          heading outline stays clean. */}
      <div className="auth-top">
        <LandingHeroIntro
          compact
          onStart={() => scrollToAuth('signup')}
          onPreview={onPreview}
        />

        <div className="auth-card" ref={authCardRef} aria-busy={isAuthBusy ? 'true' : 'false'}>
          <div className="auth-brand">
            <span className="auth-bolt" aria-hidden="true">&lt;/&gt;</span>
            <p className="auth-title">CodeHerWay</p>
            <p className="auth-sub">Learn. Build. Ship.</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              aria-controls="auth-form-panel"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setModeAndClearError('login')}
              disabled={isAuthBusy}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              aria-controls="auth-form-panel"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setModeAndClearError('signup')}
              disabled={isAuthBusy}
            >
              Create account
            </button>
          </div>
          <p className="auth-mode-copy">
            {mode === 'signup'
              ? 'Create your account to unlock every course and start learning in one session.'
              : 'Already using CodeHerWay? Sign in to resume where you left off, or reset your password if needed.'}
          </p>
          {authDisabled && (
            <div
              className="auth-info ui-status ui-status-info"
              role="status"
              aria-live="polite"
            >
              Accounts are not connected in this environment yet. Preview the first lesson while the backend is being configured.
            </div>
          )}

          <form
            id="auth-form-panel"
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={isAuthBusy}
            noValidate
          >
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-display-name">Display Name</label>
                <input
                  id="auth-display-name"
                  className="ui-input"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  ref={displayNameRef}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, displayName: true }))}
                  required
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  disabled={isAuthBusy || authDisabled}
                  aria-describedby="auth-display-name-help"
                  aria-invalid={Boolean(displayNameInlineError)}
                />
                <p
                  id="auth-display-name-help"
                  className={`auth-field-help ${displayNameInlineError ? 'auth-field-help-error' : ''}`}
                  role={displayNameInlineError ? 'alert' : undefined}
                >
                  {displayNameInlineError || `${displayName.length}/${DISPLAY_NAME_MAX_LENGTH} characters`}
                </p>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="ui-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                ref={emailRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                required
                disabled={isAuthBusy || authDisabled}
                aria-describedby="auth-email-help"
                aria-invalid={Boolean(emailInlineError)}
              />
              <p
                id="auth-email-help"
                className={`auth-field-help ${emailInlineError ? 'auth-field-help-error' : ''}`}
                role={emailInlineError ? 'alert' : undefined}
              >
                {emailInlineError || 'Use your account email address.'}
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="ui-input"
                type="password"
                placeholder="********"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
                minLength={PASSWORD_MIN_LENGTH}
                disabled={isAuthBusy || authDisabled}
                aria-describedby="auth-password-help"
                aria-invalid={Boolean(passwordInlineError)}
              />
              <p
                id="auth-password-help"
                className={`auth-field-help ${passwordInlineError ? 'auth-field-help-error' : ''}`}
                role={passwordInlineError ? 'alert' : undefined}
              >
                {passwordInlineError || `Use at least ${PASSWORD_MIN_LENGTH} characters.`}
              </p>
            </div>

            {mode === 'login' && (
              <>
                <div className="auth-inline-actions">
                  <button
                    type="button"
                    className="auth-reset-link"
                    onClick={handleForgotPassword}
                    disabled={isAuthBusy || authDisabled}
                  >
                    {sendingReset ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>
                <p className="auth-inline-note">
                  Use your account email above. We&apos;ll send a secure reset link.
                </p>
              </>
            )}

            {error && (
              <div
                id="auth-form-error"
                className="auth-error ui-status ui-status-error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
            {info && (
              <div
                id="auth-form-info"
                className="auth-success ui-status ui-status-success"
                role="status"
                aria-live="polite"
              >
                {info}
              </div>
            )}

            <button
              className="auth-submit ui-btn ui-btn-primary"
              type="submit"
              disabled={isAuthBusy || authDisabled}
              aria-busy={loading}
              aria-describedby={
                [error ? 'auth-form-error' : null, info ? 'auth-form-info' : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create free account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <AuthSocialButtons
            onSignIn={handleSocialSignIn}
            signInWithGithub={signInWithGithub}
            signInWithGoogle={signInWithGoogle}
            socialLoading={socialLoading}
            disabled={isAuthBusy || authDisabled}
          />

          {onPreview && (
            <div className="auth-preview-wrap">
              <button
                type="button"
                className="auth-preview-btn ui-btn ui-btn-ghost"
                onClick={onPreview}
                aria-label="Preview a lesson before signing in"
              >
                Preview first lesson (no account required)
              </button>
              <p className="auth-preview-note">
                Try the first lesson before you decide what to save.
              </p>
            </div>
          )}

          <p className="auth-footer">
            Where women code, lead, and rewrite the future of tech.
          </p>
        </div>
      </div>

      {/* The scroll story lives below the fold - 4 code panels + outro. */}
      <LandingHeroStory />
    </main>
  );
}




