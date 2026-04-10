// ═══════════════════════════════════════════════
// PROFILE PAGE — User info, stats, and badges
// ═══════════════════════════════════════════════

import { useAuth, useProgress, useTheme } from '../../providers';
import { COURSES } from '../../data';
import { BADGE_DEFS } from '../../context/ProgressContext';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';

export function ProfilePage({ onClose }) {
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
    <div className={`loading-screen ${theme}`} style={{ overflow: 'auto' }}>
      <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-dim)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={signOut}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'none', color: 'var(--text-muted)', fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Avatar + Name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--pink), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: 'white',
          }}>
            {displayName[0].toUpperCase()}
          </div>
          <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            {displayName}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            {user?.email}
          </p>
          {joined && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Joined {joined}</p>}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { value: level, label: 'Level' },
            { value: xpTotal.toLocaleString(), label: 'XP' },
            { value: streak, label: 'Streak' },
            { value: completed.length, label: 'Lessons' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px 8px', borderRadius: 12,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
            <span>Level {level}</span>
            <span>{xpInLevel}/{XP_PER_LEVEL} XP to Level {level + 1}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, borderRadius: 3, background: 'var(--pink)', transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Course Progress */}
        <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          Course Progress
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {courseStats.map(c => (
            <div key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{c.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{c.label}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>{c.done}/{c.total}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.pct}%`, borderRadius: 3, background: c.accent, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          Badges ({badgeCount}/{BADGE_DEFS.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 32 }}>
          {BADGE_DEFS.map(b => {
            const earned = !!earnedBadges[b.id];
            return (
              <div key={b.id} style={{
                textAlign: 'center', padding: '14px 8px', borderRadius: 10,
                background: 'var(--bg-surface)', border: `1px solid ${earned ? 'var(--pink)' : 'var(--border)'}`,
                opacity: earned ? 1 : 0.35, transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: earned ? 'var(--pink)' : 'var(--text-dim)' }}>
                  {b.name}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Activity */}
        <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          Activity
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: '★', value: bookmarks.length, label: 'Bookmarks' },
            { icon: '✏️', value: Object.keys(notes).length, label: 'Notes' },
            { icon: '📚', value: `${Math.round(completed.length / totalLessons * 100) || 0}%`, label: 'Overall' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: 14, borderRadius: 10,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
