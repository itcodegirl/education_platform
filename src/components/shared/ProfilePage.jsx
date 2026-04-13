// ═══════════════════════════════════════════════
// PROFILE PAGE — User info, stats, and badges
// ═══════════════════════════════════════════════

import { memo, useEffect, useState } from 'react';
import { useAuth, useProgress, useTheme } from '../../providers';
import { COURSES } from '../../data';
import { BADGE_DEFS } from '../../context/ProgressContext';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';
import { supabase } from '../../lib/supabaseClient';

export const ProfilePage = memo(function ProfilePage({ onClose }) {
  const { user, profile, signOut } = useAuth();
  const { theme } = useTheme();
  const {
    completed = [], xpTotal = 0, streak = 0,
    earnedBadges = {}, bookmarks = [], notes = {},
  } = useProgress();

  // ─── Public profile toggle ────────────────
  // Loads straight from the profiles row so we don't block on a
  // round-trip through ProgressContext.
  const [isPublic, setIsPublic] = useState(false);
  const [publicHandle, setPublicHandle] = useState('');
  const [publicSaving, setPublicSaving] = useState(false);
  const [publicError, setPublicError] = useState('');
  const [publicSaved, setPublicSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_public, public_handle')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setIsPublic(!!data.is_public);
      setPublicHandle(data.public_handle || '');
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const savePublicSettings = async (nextIsPublic, nextHandle) => {
    setPublicSaving(true);
    setPublicError('');
    setPublicSaved(false);

    const cleanHandle = (nextHandle || '').trim().toLowerCase();

    if (nextIsPublic) {
      if (!/^[a-z0-9_-]{2,30}$/.test(cleanHandle)) {
        setPublicError('Handle must be 2–30 chars: letters, numbers, dash, underscore.');
        setPublicSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_public: nextIsPublic,
        public_handle: nextIsPublic ? cleanHandle : null,
      })
      .eq('id', user.id);

    setPublicSaving(false);
    if (error) {
      // unique_violation on public_handle
      if ((error.code || '').startsWith('23')) {
        setPublicError('That handle is already taken. Try another.');
      } else {
        setPublicError(error.message || 'Could not save.');
      }
      return;
    }
    setIsPublic(nextIsPublic);
    setPublicHandle(nextIsPublic ? cleanHandle : '');
    setPublicSaved(true);
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
  const level = getLevel(xpTotal);
  const xpInLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  const courseStats = COURSES.map(c => {
    const total = c.modules.reduce((s, m) => s + m.lessons.length, 0);
    const done = completed.filter(k => k.startsWith(c.label)).length;
    return { ...c, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  const totalLessons = courseStats.reduce((s, c) => s + c.total, 0);
  const badgeCount = Object.keys(earnedBadges).length;

  return (
    <div className={`loading-screen ${theme} pp-scroll`}>
      <div className="pp-container">

        <div className="pp-header">
          <button type="button" className="pp-back-btn" onClick={onClose}>← Back</button>
          <button type="button" className="pp-signout-btn" onClick={signOut}>Sign Out</button>
        </div>

        <div className="pp-avatar-section">
          <div className="pp-avatar-lg">{displayName[0].toUpperCase()}</div>
          <h2 className="pp-name">{displayName}</h2>
          <p className="pp-email">{user?.email}</p>
          {joined && <p className="pp-joined">Joined {joined}</p>}
        </div>

        <div className="pp-stats-grid">
          {[
            { value: level, label: 'Level' },
            { value: xpTotal.toLocaleString(), label: 'XP' },
            { value: streak, label: 'Streak' },
            { value: completed.length, label: 'Lessons' },
          ].map((s, i) => (
            <div key={i} className="pp-stat-card">
              <div className="pp-stat-value">{s.value}</div>
              <div className="pp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="pp-xp-section">
          <div className="pp-xp-info">
            <span>Level {level}</span>
            <span>{xpInLevel}/{XP_PER_LEVEL} XP to Level {level + 1}</span>
          </div>
          <div className="pp-xp-track">
            <div className="pp-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <h3 className="pp-section-title">Course Progress</h3>
        <div className="pp-course-list">
          {courseStats.map(c => (
            <div key={c.id} className="pp-course-row">
              <div className="pp-course-info">
                <span>{c.icon}</span>
                <span className="pp-course-name">{c.label}</span>
                <span className="pp-course-count">{c.done}/{c.total}</span>
              </div>
              <div className="pp-xp-track">
                <div className="pp-xp-fill" style={{ width: `${c.pct}%`, background: c.accent }} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="pp-section-title">Badges ({badgeCount}/{BADGE_DEFS.length})</h3>
        <div className="pp-badge-grid">
          {BADGE_DEFS.map(b => {
            const earned = !!earnedBadges[b.id];
            return (
              <div key={b.id} className={`pp-badge-card ${earned ? 'earned' : 'locked'}`}>
                <div className="pp-badge-icon">{b.icon}</div>
                <div className={`pp-badge-name ${earned ? 'earned' : ''}`}>{b.name}</div>
                <div className="pp-badge-desc">{b.desc}</div>
              </div>
            );
          })}
        </div>

        <h3 className="pp-section-title">Public profile</h3>
        <div className="pp-public-card">
          <div className="pp-public-head">
            <div>
              <div className="pp-public-title">Share a public page</div>
              <div className="pp-public-sub">
                A read-only page at <code>/#u/your-handle</code> showing your level, XP, streak, and badge count. Nothing else is exposed.
              </div>
            </div>
            <label className="pp-public-switch">
              <input
                type="checkbox"
                checked={isPublic}
                disabled={publicSaving}
                onChange={(e) => {
                  const next = e.target.checked;
                  // When turning ON without a handle, don't save yet — wait for user to type one.
                  if (next && !publicHandle) {
                    setIsPublic(true);
                    return;
                  }
                  savePublicSettings(next, publicHandle);
                }}
              />
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </label>
          </div>

          {isPublic && (
            <div className="pp-public-form">
              <label className="pp-public-label" htmlFor="pp-handle">Handle</label>
              <div className="pp-public-row">
                <span className="pp-public-prefix">/#u/</span>
                <input
                  id="pp-handle"
                  className="pp-public-input"
                  type="text"
                  value={publicHandle}
                  onChange={(e) => setPublicHandle(e.target.value)}
                  placeholder="jenna"
                  maxLength={30}
                  disabled={publicSaving}
                />
                <button
                  type="button"
                  className="pp-public-save"
                  disabled={publicSaving}
                  onClick={() => savePublicSettings(true, publicHandle)}
                >
                  {publicSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              {publicHandle && !publicError && publicSaved && (
                <a
                  className="pp-public-link"
                  href={`#u/${publicHandle}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View your public page →
                </a>
              )}
            </div>
          )}

          {publicError && <div className="pp-public-error">{publicError}</div>}
          {publicSaved && !publicError && (
            <div className="pp-public-success">Saved.</div>
          )}
        </div>

        <h3 className="pp-section-title">Activity</h3>
        <div className="pp-activity-grid">
          {[
            { icon: '★', value: bookmarks.length, label: 'Bookmarks' },
            { icon: '✏️', value: Object.keys(notes).length, label: 'Notes' },
            { icon: '📚', value: `${Math.round(completed.length / totalLessons * 100) || 0}%`, label: 'Overall' },
          ].map((s, i) => (
            <div key={i} className="pp-stat-card">
              <div className="pp-activity-icon">{s.icon}</div>
              <div className="pp-stat-value">{s.value}</div>
              <div className="pp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
