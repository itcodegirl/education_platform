import { useRef, useState } from 'react';
import { useAuth } from '../../providers';
import { Logo } from '../shared/Logo';
import { LandingHeroIntro, LandingHeroStory } from './LandingHero';

const PASSWORD_MIN_LENGTH = 6;
const DISPLAY_NAME_MAX_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ onPreview }) {
  const {
    signIn,
    signUp,
    signInWithGithub,
    signInWithGoogle,
    forgotPassword,
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
    // On desktop the card is already in the first viewport — scroll is a
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
          setError(err.message);
        } else {
          setConfirmSent(true);
        }
      } else {
        const { error: err } = await signIn(normalizedEmail, password);
        if (err) {
          setError(err.message);
        }
      }
    } catch {
      setError('Connection failed. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your email first, then select Forgot password.');
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
        setError(err.message || 'Unable to send a reset link right now.');
      } else {
        setInfo(`Password reset link sent to ${normalizedEmail}. Check your inbox and spam folder.`);
      }
    } catch {
      setError('Unable to send a reset link right now.');
    } finally {
      setSendingReset(false);
    }
  };

  const emailInlineError = touched.email && email.trim() && !EMAIL_PATTERN.test(email.trim())
    ? 'Enter a valid email format (example: you@example.com).'
    : '';
  const passwordInlineError = touched.password && password.length > 0 && password.length < PASSWORD_MIN_LENGTH
    ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    : '';
  const displayNameInlineError = mode === 'signup' && touched.displayName && !displayName.trim()
    ? 'Display name is required.'
    : '';

  if (confirmSent) {
    return (
      <main className="auth-page" id="top">
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
              onClick={() => {
                setConfirmSent(false);
                setMode('login');
              }}
              aria-label="Return to login after confirming your account"
            >
              Back to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page auth-with-hero" id="top">
      {/* Above the fold: intro on the left, auth card on the right.
          LandingHeroIntro provides the single <h1> for this page. The
          auth card's brand row is intentionally not an extra <h1> so the
          heading outline stays clean. */}
      <div className="auth-top">
        <LandingHeroIntro compact onStart={() => scrollToAuth('signup')} />

        <div className="auth-card" ref={authCardRef} aria-busy={loading || sendingReset ? 'true' : 'false'}>
          <div className="auth-brand">
            <span className="auth-bolt" aria-hidden="true">⚡</span>
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
              disabled={loading}
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
              disabled={loading}
            >
              Create account
            </button>
          </div>
          <p className="auth-mode-copy">
            {mode === 'signup'
              ? 'Create your account to unlock every course and start learning in one session.'
              : 'Already using CodeHerWay? Sign in to resume where you left off.'}
          </p>

          <form
            id="auth-form-panel"
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={loading || sendingReset}
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
                  disabled={loading}
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
                disabled={loading}
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
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
                minLength={PASSWORD_MIN_LENGTH}
                disabled={loading}
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
              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-reset-link"
                  onClick={handleForgotPassword}
                  disabled={loading || sendingReset}
                >
                  {sendingReset ? 'Sending reset link...' : 'Forgot password?'}
                </button>
              </div>
            )}

            {error && (
              <div className="auth-error ui-status ui-status-error" role="alert" aria-live="assertive">
                {error}
              </div>
            )}
            {info && (
              <div className="auth-success ui-status ui-status-success" role="status" aria-live="polite">
                {info}
              </div>
            )}

            <button className="auth-submit ui-btn ui-btn-primary" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? '...' : mode === 'login' ? 'Log in' : 'Create free account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-social">
            <button
              type="button"
              className="auth-social-btn ui-btn ui-btn-secondary"
              onClick={signInWithGithub}
              aria-label="Continue with GitHub"
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
            <button
              type="button"
              className="auth-social-btn ui-btn ui-btn-secondary"
              onClick={signInWithGoogle}
              aria-label="Continue with Google"
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {onPreview && (
            <button
              type="button"
              className="auth-preview-btn ui-btn ui-btn-ghost"
              onClick={onPreview}
              aria-label="Preview a lesson before signing in"
            >
              👋 I want to preview first
            </button>
          )}

          <p className="auth-footer">
            Where women code, lead, and rewrite the future of tech.
          </p>
        </div>
      </div>

      {/* The scroll story lives below the fold — 4 code panels + outro. */}
      <LandingHeroStory />
    </main>
  );
}
