import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Logo } from './Logo';
import { XP_PER_LEVEL, getLevel, getXPInLevel } from '../../utils/helpers';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import '../../styles/public-profile.css';

const PROFILE_ERROR = {
  MISSING_HANDLE: 'missing-handle',
  NOT_FOUND: 'not-found',
  UNAVAILABLE: 'unavailable',
};

export function PublicProfile({ handle, onClose }) {
  const [state, setState] = useState({ loading: true, errorType: null, profile: null });
  const [retryCount, setRetryCount] = useState(0);

  useDocumentTitle(
    state.profile?.display_name
      ? `${state.profile.display_name}'s profile`
      : handle
        ? `@${handle}`
        : 'Public profile',
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!handle) {
        setState({ loading: false, errorType: PROFILE_ERROR.MISSING_HANDLE, profile: null });
        return;
      }

      setState({ loading: true, errorType: null, profile: null });

      try {
        const { data, error } = await supabase
          .from('public_profiles')
          .select(
            'id, display_name, avatar_url, handle, xp_total, streak_days, lessons_completed, badges_earned',
          )
          .ilike('handle', handle)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setState({ loading: false, errorType: PROFILE_ERROR.UNAVAILABLE, profile: null });
          return;
        }

        if (!data) {
          setState({ loading: false, errorType: PROFILE_ERROR.NOT_FOUND, profile: null });
          return;
        }

        setState({ loading: false, errorType: null, profile: data });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            errorType: PROFILE_ERROR.UNAVAILABLE,
            profile: null,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [handle, retryCount]);

  if (state.loading) {
    return (
      <div className="pub-profile">
        <div
          className="pub-card pub-card-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Logo size="sm" />
          <p className="pub-loading">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (state.errorType || !state.profile) {
    const isMissingOrNotFound =
      state.errorType === PROFILE_ERROR.MISSING_HANDLE ||
      state.errorType === PROFILE_ERROR.NOT_FOUND;

    return (
      <div className="pub-profile">
        <div className="pub-card pub-card-center" role="alert">
          <div className="pub-notfound-icon" aria-hidden="true">🌙</div>
          <h1 className="pub-notfound-title">
            {isMissingOrNotFound ? 'Profile not found' : 'Profile temporarily unavailable'}
          </h1>
          <p className="pub-notfound-msg">
            {state.errorType === PROFILE_ERROR.NOT_FOUND
              ? `We couldn't find a public profile for "${handle}".`
              : state.errorType === PROFILE_ERROR.MISSING_HANDLE
                ? 'Open a valid public profile link to view this learner snapshot.'
                : 'We could not load this profile. Check your connection and try again.'}
          </p>
          <div className="pub-actions">
            {!isMissingOrNotFound && (
              <button
                type="button"
                className="pub-cta pub-cta-button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try again
              </button>
            )}
            <a className="pub-cta" href="/">
              Go to CodeHerWay &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  const {
    display_name,
    handle: profileHandle,
    xp_total,
    streak_days,
    lessons_completed,
    badges_earned,
  } = state.profile;
  const level = getLevel(xp_total || 0);
  const xpInLevel = getXPInLevel(xp_total || 0);
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const initial = (display_name || profileHandle || '?').trim().charAt(0).toUpperCase();
  const momentumCopy =
    (streak_days || 0) > 0
      ? `${streak_days} day streak and still shipping`
      : 'Showing up and building from lesson one';

  return (
    <div className="pub-profile">
      <header className="pub-header">
        <Logo size="sm" />
        {onClose && (
          <button
            type="button"
            className="pub-close"
            onClick={onClose}
            aria-label="Close public profile"
          >
            ×
          </button>
        )}
      </header>

      <div className="pub-card">
        <span className="pub-overline">Public builder card</span>
        <div className="pub-avatar">{initial}</div>
        <h1 className="pub-name">{display_name || profileHandle}</h1>
        <p className="pub-handle">@{profileHandle}</p>
        <p className="pub-summary">
          This learner is building with CodeHerWay and sharing a progress snapshot:
          completed lessons, momentum, and motivational milestones.
        </p>

        <div className="pub-pill-row" aria-label="Public progress summary">
          <span className="pub-pill">Level {level}</span>
          <span className="pub-pill warm">{lessons_completed || 0} lessons completed</span>
          <span className="pub-pill accent">{momentumCopy}</span>
        </div>

        <div className="pub-level">
          <div className="pub-level-row">
            <span>Level {level}</span>
            <span>
              {xpInLevel}/{XP_PER_LEVEL} motivational XP to Level {level + 1}
            </span>
          </div>
          <div className="pub-level-track">
            <div className="pub-level-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="pub-stats">
          <div className="pub-stat">
            <div className="pub-stat-value">{(xp_total || 0).toLocaleString()}</div>
            <div className="pub-stat-label">Motivational XP</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">
              {streak_days || 0}
              <span className="pub-stat-unit"> 🔥</span>
            </div>
            <div className="pub-stat-label">Day streak</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">{lessons_completed || 0}</div>
            <div className="pub-stat-label">Lessons completed</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">{badges_earned || 0}</div>
            <div className="pub-stat-label">Badges earned</div>
          </div>
        </div>

        <a className="pub-cta" href="/">
          Start learning on CodeHerWay &rarr;
        </a>

        <p className="pub-footer">
          Public progress snapshot - not a verified credential - shared by {display_name || profileHandle}
        </p>
      </div>
    </div>
  );
}




