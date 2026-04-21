import { memo, useEffect, useState } from 'react';
import { useAuth, useCourseContent, useProgress, useTheme } from '../../providers';
import { COURSES } from '../../data';
import { BADGE_DEFS } from '../../context/ProgressContext';
import { XP_PER_LEVEL, getLevel, getXPInLevel } from '../../utils/helpers';
import { supabase } from '../../lib/supabaseClient';

export const ProfilePage = memo(function ProfilePage({ onClose }) {
  const { user, profile, signOut } = useAuth();
  const { theme } = useTheme();
  const {
    completed = [],
    xpTotal = 0,
    streak = 0,
    earnedBadges = {},
    bookmarks = [],
    notes = {},
  } = useProgress();
  const { ensureAllLoaded } = useCourseContent();

  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

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

      setIsPublic(Boolean(data.is_public));
      setPublicHandle(data.public_handle || '');
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const savePublicSettings = async (nextIsPublic, nextHandle) => {
    setPublicSaving(true);
    setPublicError('');
    setPublicSaved(false);

    const cleanHandle = (nextHandle || '').trim().toLowerCase();

    if (nextIsPublic && !/^[a-z0-9_-]{2,30}$/.test(cleanHandle)) {
      setPublicError('Handle must be 2-30 chars: letters, numbers, dash, underscore.');
      setPublicSaving(false);
      return;
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

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Learner';
  const level = getLevel(xpTotal);
  const xpInLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  const courseStats = COURSES.map((course) => {
    const total = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const done = completed.filter((key) => key.startsWith(course.label)).length;

    return {
      ...course,
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  const totalLessons = courseStats.reduce((sum, course) => sum + course.total, 0);
  const badgeCount = Object.keys(earnedBadges).length;

  return (
    <div className={`loading-screen ${theme} pp-scroll`}>
      <div className="pp-container">
        <div className="pp-header">
          <button type="button" className="pp-back-btn" onClick={onClose}>
            &larr; Back
          </button>
          <button type="button" className="pp-signout-btn" onClick={signOut}>
            Sign out
          </button>
        </div>

        <div className="pp-avatar-section">
          <span className="pp-eyebrow">Your builder profile</span>
          <div className="pp-avatar-lg">{displayName[0].toUpperCase()}</div>
          <h2 className="pp-name">{displayName}</h2>
          <p className="pp-email">{user?.email}</p>
          {joined && <p className="pp-joined">Joined {joined}</p>}
          <p className="pp-hero-copy">
            This is your proof-of-progress page: streaks, shipped lessons, and the
            momentum you are building one session at a time.
          </p>
          <div className="pp-status-row" aria-label="Current learning status">
            <span className="pp-status-pill">Level {level}</span>
            <span className="pp-status-pill warm">
              {completed.length}/{totalLessons} lessons shipped
            </span>
            {streak > 0 && (
              <span className="pp-status-pill accent">{streak} day streak</span>
            )}
          </div>
        </div>

        <div className="pp-stats-grid">
          {[
            { value: level, label: 'Level' },
            { value: xpTotal.toLocaleString(), label: 'XP' },
            { value: streak, label: 'Streak' },
            { value: completed.length, label: 'Lessons' },
          ].map((stat) => (
            <div key={stat.label} className="pp-stat-card">
              <div className="pp-stat-value">{stat.value}</div>
              <div className="pp-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="pp-xp-section">
          <div className="pp-xp-info">
            <span>Level {level}</span>
            <span>
              {xpInLevel}/{XP_PER_LEVEL} XP to Level {level + 1}
            </span>
          </div>
          <div className="pp-xp-track">
            <div className="pp-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <h3 className="pp-section-title">Your learning map</h3>
        <div className="pp-course-list">
          {courseStats.map((course) => (
            <div key={course.id} className="pp-course-row">
              <div className="pp-course-info">
                <span>{course.icon}</span>
                <span className="pp-course-name">{course.label}</span>
                <span className="pp-course-count">
                  {course.done}/{course.total}
                </span>
              </div>
              <div className="pp-xp-track">
                <div
                  className="pp-xp-fill"
                  style={{ width: `${course.pct}%`, background: course.accent }}
                />
              </div>
            </div>
          ))}
        </div>

        <h3 className="pp-section-title">
          Proof of progress ({badgeCount}/{BADGE_DEFS.length})
        </h3>
        <div className="pp-badge-grid">
          {BADGE_DEFS.map((badge) => {
            const earned = Boolean(earnedBadges[badge.id]);

            return (
              <div
                key={badge.id}
                className={`pp-badge-card ${earned ? 'earned' : 'locked'}`}
              >
                <div className="pp-badge-icon">{badge.icon}</div>
                <div className={`pp-badge-name ${earned ? 'earned' : ''}`}>
                  {badge.name}
                </div>
                <div className="pp-badge-desc">{badge.desc}</div>
              </div>
            );
          })}
        </div>

        <h3 className="pp-section-title">Share your public page</h3>
        <div className="pp-public-card">
          <div className="pp-public-head">
            <div>
              <div className="pp-public-title">Let your progress speak for itself</div>
              <div className="pp-public-sub">
                Create a read-only page at <code>/#u/your-handle</code> that shows your
                level, XP, streak, lessons shipped, and badge count. No email, notes, or
                private progress details are exposed.
              </div>
            </div>
            <label className="pp-public-switch">
              <input
                type="checkbox"
                checked={isPublic}
                disabled={publicSaving}
                onChange={(event) => {
                  const next = event.target.checked;

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
              <label className="pp-public-label" htmlFor="pp-handle">
                Handle
              </label>
              <div className="pp-public-row">
                <span className="pp-public-prefix">/#u/</span>
                <input
                  id="pp-handle"
                  className="pp-public-input"
                  type="text"
                  value={publicHandle}
                  onChange={(event) => setPublicHandle(event.target.value)}
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
                  {publicSaving ? 'Saving...' : 'Publish'}
                </button>
              </div>
              {publicHandle && !publicError && publicSaved && (
                <a
                  className="pp-public-link"
                  href={`#u/${publicHandle}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open your public page &rarr;
                </a>
              )}
            </div>
          )}

          {publicError && <div className="pp-public-error">{publicError}</div>}
          {publicSaved && !publicError && (
            <div className="pp-public-success">Saved.</div>
          )}
        </div>

        <h3 className="pp-section-title">Quiet signals</h3>
        <div className="pp-activity-grid">
          {[
            { icon: '★', value: bookmarks.length, label: 'Bookmarks' },
            { icon: '✏️', value: Object.keys(notes).length, label: 'Notes' },
            {
              icon: '📚',
              value: `${Math.round((completed.length / totalLessons) * 100) || 0}%`,
              label: 'Overall',
            },
          ].map((stat) => (
            <div key={stat.label} className="pp-stat-card">
              <div className="pp-activity-icon">{stat.icon}</div>
              <div className="pp-stat-value">{stat.value}</div>
              <div className="pp-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
