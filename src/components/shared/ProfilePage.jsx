import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useProgressData, useXP, useSR, useTheme, BADGE_DEFS } from '../../providers';
import { XP_PER_LEVEL, getLevel, getXPInLevel } from '../../utils/helpers';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { buildLearnerTranscriptSummary } from '../../utils/learnerTranscript';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { supabase } from '../../lib/supabaseClient';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';
import { COURSE_CATALOG } from '../../data/reference/course-catalog';
import {
  areChallengesLoaded,
  getChallengesForCourse,
  loadAllChallenges,
} from '../../data/challenges';
import { parseQuizScore } from '../../services/rewardPolicy';
import '../../styles/feature-profile.css';

function getPublicProfileSaveError(error) {
  if ((error?.code || '').startsWith('23')) {
    return 'That handle is already taken. Try another.';
  }

  return 'Could not save public profile settings. Check your connection and try again.';
}

export const ProfilePage = memo(function ProfilePage({ onClose }) {
  const { user, profile, signOut } = useAuth();
  const { theme } = useTheme();
  const { completed = [], quizScores = {}, challengeCompletions = [] } = useProgressData();
  const { xpTotal = 0, streak = 0, pausedStreak = null, earnedBadges = {} } = useXP();
  const { bookmarks = [], notes = {}, srCards = [] } = useSR();

  useDocumentTitle('Your profile');

  const [isPublic, setIsPublic] = useState(false);
  const [publicHandle, setPublicHandle] = useState('');
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicLoadError, setPublicLoadError] = useState('');
  const [publicSaving, setPublicSaving] = useState(false);
  const [publicError, setPublicError] = useState('');
  const [publicSaved, setPublicSaved] = useState(false);
  const [challengeCatalogReady, setChallengeCatalogReady] = useState(
    () => COURSE_CATALOG.every((course) => areChallengesLoaded(course.id)),
  );

  const loadPublicSettings = useCallback(async () => {
    if (!user?.id) {
      setPublicLoading(false);
      return;
    }

    setPublicLoading(true);
    setPublicLoadError('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_public, public_handle')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        setPublicLoadError('Could not load public profile settings. You can keep learning and try again later.');
        return;
      }

      if (!data) return;

      setIsPublic(Boolean(data.is_public));
      setPublicHandle(data.public_handle || '');
    } catch {
      setPublicLoadError('Could not load public profile settings. You can keep learning and try again later.');
    } finally {
      setPublicLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadPublicSettings();
  }, [loadPublicSettings]);

  useEffect(() => {
    let cancelled = false;
    const alreadyLoaded = COURSE_CATALOG.every((course) => areChallengesLoaded(course.id));
    setChallengeCatalogReady(alreadyLoaded);

    if (alreadyLoaded) {
      return () => {
        cancelled = true;
      };
    }

    void loadAllChallenges()
      .then(() => {
        if (!cancelled) {
          setChallengeCatalogReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChallengeCatalogReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const savePublicSettings = async (nextIsPublic, nextHandle) => {
    // Defense in depth: ProfilePage is mounted behind the
    // renderProtected guard which redirects when user is null,
    // but a session that expires between page load and click
    // would land here with user undefined. Bail out cleanly with
    // a recoverable error instead of crashing on user.id.
    if (!user?.id) {
      setPublicError('Your session has expired. Sign in again to publish your profile.');
      return;
    }

    setPublicSaving(true);
    setPublicError('');
    setPublicLoadError('');
    setPublicSaved(false);

    const cleanHandle = (nextHandle || '').trim().toLowerCase();

    if (nextIsPublic && !/^[a-z0-9_-]{2,30}$/.test(cleanHandle)) {
      setPublicError('Handle must be 2-30 chars: letters, numbers, dash, underscore.');
      setPublicSaving(false);
      return;
    }

    let saveError = null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_public: nextIsPublic,
          public_handle: nextIsPublic ? cleanHandle : null,
        })
        .eq('id', user.id);

      saveError = error;
    } catch {
      saveError = {};
    } finally {
      setPublicSaving(false);
    }

    if (saveError) {
      setPublicError(getPublicProfileSaveError(saveError));
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
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const courseStats = COURSE_CATALOG.map((course) => {
    const total = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const done = getCourseCompletedLessonCount(completedSet, course);

    return {
      ...course,
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  const completedLessons = courseStats.reduce((sum, course) => sum + course.done, 0);
  const totalLessons = courseStats.reduce((sum, course) => sum + course.total, 0);
  const badgeCount = Object.keys(earnedBadges).length;
  const allChallenges = COURSE_CATALOG.flatMap((course) =>
    getChallengesForCourse(course.id).map((challenge) => ({
      ...challenge,
      courseId: course.id,
    })),
  );
  const completedChallengeIds = new Set(challengeCompletions);
  const completedChallengeCount = allChallenges.length > 0
    ? allChallenges.filter((challenge) => completedChallengeIds.has(challenge.id)).length
    : challengeCompletions.length;
  const quizResults = Object.values(quizScores || {})
    .map((scoreValue) => parseQuizScore(scoreValue))
    .filter(Boolean);
  const quizChecksPassed = quizResults.filter((result) => result.pct >= 80).length;
  const dueReviewCards = srCards.filter((card) => Number(card?.nextReview || 0) <= Date.now()).length;
  const transcript = buildLearnerTranscriptSummary({
    completedLessons,
    totalLessons,
    quizChecksPassed,
    quizChecksAttempted: quizResults.length,
    quizChecksNeedsReview: quizResults.length - quizChecksPassed,
    completedChallenges: completedChallengeCount,
    totalChallenges: allChallenges.length,
    dueReviewCards,
    totalReviewCards: srCards.length,
  });

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
            This is your progress page: saved lessons, motivational XP, streaks,
            and the momentum you are building one session at a time.
          </p>
          <p className="pp-hero-copy">{PROGRESS_SYNC_COPY}</p>
          <div className="pp-status-row" aria-label="Current learning status">
            <span className="pp-status-pill">Level {level}</span>
            <span className="pp-status-pill warm">
              {completedLessons}/{totalLessons} lessons completed
            </span>
            {streak > 0 ? (
              <span className="pp-status-pill accent">{streak} day streak</span>
            ) : pausedStreak ? (
              <span className="pp-status-pill">{pausedStreak.days}-day streak paused</span>
            ) : null}
          </div>
        </div>

        <div className="pp-stats-grid">
          {[
            { value: level, label: 'Level' },
            { value: xpTotal.toLocaleString(), label: 'XP' },
            {
              value: streak > 0 ? streak : pausedStreak?.days || 0,
              label: streak === 0 && pausedStreak ? 'Streak paused' : 'Streak',
            },
            { value: completedLessons, label: 'Lessons' },
          ].map((stat) => (
            <div key={stat.label} className="pp-stat-card">
              <div className="pp-stat-value">{stat.value}</div>
              <div className="pp-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="pp-transcript-card" aria-labelledby="pp-transcript-title">
          <div className="pp-transcript-head">
            <div>
              <h3 id="pp-transcript-title" className="pp-section-title">Private learning transcript</h3>
              <p className="pp-transcript-copy">
                A readiness snapshot that separates lessons completed from recall, review, and applied proof.
              </p>
            </div>
            <span className={`pp-transcript-status pp-transcript-status-${transcript.status.tone}`}>
              {transcript.status.label}
            </span>
          </div>
          <p className="pp-transcript-copy">{transcript.status.detail}</p>
          <p className="pp-transcript-action">
            <span>Next evidence step:</span> {transcript.nextAction.label}. {transcript.nextAction.detail}
          </p>
          <div className="pp-transcript-grid">
            {transcript.items.map((item) => (
              <div key={item.key} className={`pp-transcript-item pp-transcript-item-${item.tone}`}>
                <span className="pp-transcript-value">{item.value}</span>
                <span className="pp-transcript-label">{item.label}</span>
                <span className="pp-transcript-detail">{item.detail}</span>
              </div>
            ))}
          </div>
          <p className="pp-transcript-note">
            This transcript is private learning evidence, not a verified credential.
          </p>
        </section>

        <div className="pp-xp-section">
          <div className="pp-xp-info">
            <span>Level {level}</span>
            <span>
              {xpInLevel}/{XP_PER_LEVEL} motivational XP to Level {level + 1}
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
          CodeHerWay progress ({badgeCount}/{BADGE_DEFS.length})
        </h3>
        {/* List semantics + per-badge earned/locked status, mirroring
            BadgesPanel — without these the screen-reader experience
            was identical for earned and locked badges (visual-only).
            Earned date isn't stored here on the profile (the dated
            record lives in earnedBadges), so we just say earned/locked. */}
        <ul
          className="pp-badge-grid"
          aria-label={`${badgeCount} of ${BADGE_DEFS.length} badges earned`}
        >
          {BADGE_DEFS.map((badge) => {
            const earned = Boolean(earnedBadges[badge.id]);
            const status = earned ? 'earned' : 'locked';

            return (
              <li
                key={badge.id}
                className={`pp-badge-card ${earned ? 'earned' : 'locked'}`}
                aria-label={`${badge.name}, ${status}. ${badge.desc}`}
              >
                <div className="pp-badge-icon" aria-hidden="true">{badge.icon}</div>
                <div className={`pp-badge-name ${earned ? 'earned' : ''}`}>
                  {badge.name}
                </div>
                <div className="pp-badge-desc">{badge.desc}</div>
              </li>
            );
          })}
        </ul>

        <h3 className="pp-section-title">Share your public page</h3>
        <div className="pp-public-card">
          <div className="pp-public-head">
            <div>
              <div className="pp-public-title">Share a progress snapshot</div>
              <div className="pp-public-sub">
                Create a read-only page at <code>/u/your-handle</code> that shows your
                level, motivational XP, streak, completed lessons, and badge count.
                This is a learning snapshot, not a verified credential. No email,
                notes, or private progress details are exposed.
              </div>
            </div>
            <label className="pp-public-switch">
              <input
                type="checkbox"
                checked={isPublic}
                disabled={publicSaving || publicLoading}
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
                <span className="pp-public-prefix">/u/</span>
                <input
                  id="pp-handle"
                  className="pp-public-input"
                  type="text"
                  value={publicHandle}
                  onChange={(event) => setPublicHandle(event.target.value)}
                  placeholder="jenna"
                  maxLength={30}
                  disabled={publicSaving}
                  readOnly={publicLoading}
                  aria-invalid={Boolean(publicError)}
                  aria-describedby="pp-handle-help pp-public-status"
                />
                <button
                  type="button"
                  className="pp-public-save"
                  disabled={publicSaving || publicLoading}
                  onClick={() => savePublicSettings(true, publicHandle)}
                >
                  {publicSaving ? 'Saving…' : 'Publish'}
                </button>
              </div>
              <p id="pp-handle-help" className="sr-only">
                Use 2 to 30 characters: letters, numbers, dashes, or underscores.
              </p>
              {publicHandle && !publicError && publicSaved && (
                <a
                  className="pp-public-link"
                  href={`/u/${publicHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open your public page &rarr;
                </a>
              )}
            </div>
          )}

          <div
            id="pp-public-status"
            role={publicError || publicLoadError ? 'alert' : 'status'}
            aria-live={publicError || publicLoadError ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            {publicLoading && <div className="pp-public-muted">Loading public profile settings.</div>}
            {publicLoadError && <div className="pp-public-error">{publicLoadError}</div>}
            {publicError && <div className="pp-public-error">{publicError}</div>}
            {publicSaved && !publicError && (
              <div className="pp-public-success">Saved.</div>
            )}
          </div>
        </div>

        <h3 className="pp-section-title">Quiet signals</h3>
        {!challengeCatalogReady && (
          <p className="pp-hero-copy" role="status">
            Loading challenge history so application proof stays accurate.
          </p>
        )}
        <div className="pp-activity-grid">
          {[
            { icon: '★', value: bookmarks.length, label: 'Bookmarks' },
            { icon: '✏️', value: Object.keys(notes).length, label: 'Notes' },
            {
              icon: '📚',
              value: `${Math.round((completedLessons / totalLessons) * 100) || 0}%`,
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
