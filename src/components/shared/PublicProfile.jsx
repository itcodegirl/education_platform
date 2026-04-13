// ═══════════════════════════════════════════════
// PUBLIC PROFILE — /#u/:handle
//
// Read-only page shown to anyone (no auth required)
// when a learner opts in to a public profile. Fetches
// from the `public_profiles` VIEW in Supabase, which
// projects only: display_name, avatar_url, handle,
// xp_total, streak_days, lessons_completed,
// badges_earned. No email, no progress detail.
//
// All private data stays behind RLS — this page uses
// the same anon key the rest of the client uses, and
// the policies added in supabase-schema.sql gate
// read access on profiles.is_public = true.
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Logo } from './Logo';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';

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
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err?.message || 'Failed to load profile',
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
          <p className="pub-loading">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.profile) {
    return (
      <div className="pub-profile">
        <div className="pub-card pub-card-center">
          <div className="pub-notfound-icon">🌙</div>
          <h1 className="pub-notfound-title">Profile not found</h1>
          <p className="pub-notfound-msg">
            {state.error === 'Profile not found'
              ? `We couldn't find a public profile for "${handle}".`
              : 'Something went wrong loading this profile.'}
          </p>
          <a className="pub-cta" href="#">
            Go to CodeHerWay →
          </a>
        </div>
      </div>
    );
  }

  const { display_name, handle: dbHandle, xp_total, streak_days, lessons_completed, badges_earned } =
    state.profile;
  const level = getLevel(xp_total || 0);
  const xpInLevel = getXPInLevel(xp_total || 0);
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const initial = (display_name || dbHandle || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="pub-profile">
      <header className="pub-header">
        <Logo size="sm" />
        {onClose && (
          <button type="button" className="pub-close" onClick={onClose}>
            ✕
          </button>
        )}
      </header>

      <div className="pub-card">
        <div className="pub-avatar">{initial}</div>
        <h1 className="pub-name">{display_name || dbHandle}</h1>
        <p className="pub-handle">@{dbHandle}</p>

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
              <span className="pub-stat-unit"> 🔥</span>
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

        <a className="pub-cta" href="#">
          Start learning on CodeHerWay →
        </a>

        <p className="pub-footer">
          Public profile · shared by {display_name || dbHandle} · built on CodeHerWay
        </p>
      </div>
    </div>
  );
}
