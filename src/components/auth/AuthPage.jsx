// ═══════════════════════════════════════════════
// AUTH PAGE — Login / Signup with CodeHerWay branding
// ═══════════════════════════════════════════════

import { useState, useRef } from 'react';
import { useAuth } from '../../providers';
import { Logo } from '../shared/Logo';
import { LandingHero } from './LandingHero';

export function AuthPage({ onPreview }) {
  const { signIn, signUp, signInWithGithub, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const authCardRef = useRef(null);

  const scrollToAuth = (nextMode) => {
    if (nextMode) setMode(nextMode);
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(email, password, displayName);
        if (err) {
          setError(err.message);
        } else {
          setConfirmSent(true);
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
        }
      }
    } catch (err) {
      setError('Connection failed. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <Logo size="lg" showTagline />
          </div>
          <div className="auth-confirm">
            <span className="auth-confirm-icon">📧</span>
            <h2>Check your email</h2>
            <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <button className="auth-btn" onClick={() => { setConfirmSent(false); setMode('login'); }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <LandingHero onStart={() => scrollToAuth('signup')} />

      <div className="auth-card" ref={authCardRef}>
        <div className="auth-brand">
          <span className="auth-bolt">⚡</span>
          <h1 className="auth-title">CodeHerWay</h1>
          <p className="auth-sub">Learn. Build. Ship.</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-display-name">Display Name</label>
              <input
                id="auth-display-name"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn auth-submit" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-social">
          <button type="button" className="auth-social-btn" onClick={signInWithGithub}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </button>
          <button type="button" className="auth-social-btn" onClick={signInWithGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        {onPreview && (
          <button type="button" className="auth-preview-btn" onClick={onPreview}>
            👀 Preview a lesson first
          </button>
        )}

        <p className="auth-footer">
          Where women code, lead, and rewrite the future of tech.
        </p>
      </div>
    </div>
  );
}
