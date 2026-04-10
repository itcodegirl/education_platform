// ═══════════════════════════════════════════════
// PROFILE PAGE — User info, stats, and badges
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { useAuth, useProgress, useTheme } from '../../providers';
import { COURSES } from '../../data';
import { BADGE_DEFS } from '../../context/ProgressContext';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';

export const ProfilePage = memo(function ProfilePage({ onClose }) {
  const { user, profile, signOut } = useAuth();
  const { theme } = useTheme();
  const {
    completed = [], xpTotal = 0, streak = 0,
    earnedBadges = {}, bookmarks = [], notes = {},
  } = useProgress();

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
