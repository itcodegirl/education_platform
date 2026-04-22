import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Logo } from './Logo';
import { XP_PER_LEVEL, getLevel, getXPInLevel } from '../../utils/helpers';

export function PublicProfile({ handle, onClose }) {
  const [state, setState] = useState({ loading: true, error: null, profile: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!handle) {
        setState({ loading: false, error: 'No handle provided', profile: null });
        return;
      }

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
          setState({ loading: false, error: error.message, profile: null });
          return;
        }

        if (!data) {
          setState({ loading: false, error: 'Profile not found', profile: null });
          return;
        }

        setState({ loading: false, error: null, profile: data });
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error?.message || 'Failed to load profile',
            profile: null,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (state.loading) {
    return (
      <div className="pub-profile">
        <div className="pub-card pub-card-center">
          <Logo size="sm" />
          <p className="pub-loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.profile) {
    return (
      <div className="pub-profile">
        <div className="pub-card pub-card-center">
          <div className="pub-notfound-icon">ðŸŒ™</div>
          <h1 className="pub-notfound-title">Profile not found</h1>
          <p className="pub-notfound-msg">
            {state.error === 'Profile not found'
              ? `We couldn't find a public profile for "${handle}".`
              : 'Something went wrong loading this profile.'}
          </p>
          <a className="pub-cta" href="/">
            Go to Cinova &rarr;
          </a>
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
            âœ•
          </button>
        )}
      </header>

      <div className="pub-card">
        <span className="pub-overline">Public builder card</span>
        <div className="pub-avatar">{initial}</div>
        <h1 className="pub-name">{display_name || profileHandle}</h1>
        <p className="pub-handle">@{profileHandle}</p>
        <p className="pub-summary">
          This learner is building with Cinova and sharing the proof: progress,
          momentum, and shipped lessons.
        </p>

        <div className="pub-pill-row" aria-label="Public progress summary">
          <span className="pub-pill">Level {level}</span>
          <span className="pub-pill warm">{lessons_completed || 0} lessons shipped</span>
          <span className="pub-pill accent">{momentumCopy}</span>
        </div>

        <div className="pub-level">
          <div className="pub-level-row">
            <span>Level {level}</span>
            <span>
              {xpInLevel}/{XP_PER_LEVEL} XP to Level {level + 1}
            </span>
          </div>
          <div className="pub-level-track">
            <div className="pub-level-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="pub-stats">
          <div className="pub-stat">
            <div className="pub-stat-value">{(xp_total || 0).toLocaleString()}</div>
            <div className="pub-stat-label">Total XP</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">
              {streak_days || 0}
              <span className="pub-stat-unit"> ðŸ”¥</span>
            </div>
            <div className="pub-stat-label">Day streak</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">{lessons_completed || 0}</div>
            <div className="pub-stat-label">Lessons shipped</div>
          </div>
          <div className="pub-stat">
            <div className="pub-stat-value">{badges_earned || 0}</div>
            <div className="pub-stat-label">Badges earned</div>
          </div>
        </div>

        <a className="pub-cta" href="/">
          Start learning on Cinova &rarr;
        </a>

        <p className="pub-footer">
          Public profile Â· shared by {display_name || profileHandle} Â· built on Cinova
        </p>
      </div>
    </div>
  );
}

