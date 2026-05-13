import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  areChallengesLoaded,
  getChallengesForCourse,
  loadChallengesForCourse,
} from '../../data/challenges';
import { COURSES } from '../../data';
import { CodeChallenge } from '../learning/CodeChallenge';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useProgressData } from '../../providers';
import { useLearning } from '../../hooks/useLearning';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';
import { getChallengeProgressionPlan } from '../../utils/challengeProgression';
import { getChallengeEvidenceSummary } from '../../utils/challengeEvidence';
import { getChallengeAnalyticsPayload } from '../../utils/learningAnalyticsPayloads';
import { trackEvent } from '../../lib/analytics';
import '../../styles/feature-challenges.css';

const CHALLENGE_LOAD_ERROR_COPY = 'The lesson workspace is still safe. Try again when your connection settles.';

export function ChallengesPanel({ courseId, lang, onClose }) {
  const [challenges, setChallenges] = useState(() => getChallengesForCourse(courseId));
  const [challengeLoadError, setChallengeLoadError] = useState('');
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(() => !areChallengesLoaded(courseId));
  const [activeChallenge, setActiveChallenge] = useState(null);
  const { challengeCompletions = [], completedSet = new Set() } = useProgressData();
  const learn = useLearning();
  const completed = useMemo(() => new Set(challengeCompletions), [challengeCompletions]);
  const course = COURSES.find((entry) => entry.id === courseId);
  const challengePlan = useMemo(
    () => getChallengeProgressionPlan({
      course,
      challenges,
      completedSet,
      completedChallengeIds: challengeCompletions,
    }),
    [challengeCompletions, challenges, completedSet, course],
  );
  const activeEvidence = useMemo(
    () => getChallengeEvidenceSummary(activeChallenge, {
      isCompleted: completed.has(activeChallenge?.id),
    }),
    [activeChallenge, completed],
  );
  const modalRef = useRef(null);
  const loadRequestRef = useRef(0);

  const openChallenge = useCallback((challenge, source) => {
    setActiveChallenge(challenge);
    trackEvent('challenge_workspace_opened', getChallengeAnalyticsPayload({
      challenge,
      courseId,
      source,
      isCompleted: completed.has(challenge?.id),
    }));
  }, [completed, courseId]);

  useFocusTrap(modalRef, {
    enabled: true,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

  const refreshChallengeList = useCallback(async ({ resetActive = false } = {}) => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    const cachedChallenges = getChallengesForCourse(courseId);
    const cachedLoaded = areChallengesLoaded(courseId);

    if (resetActive) {
      setActiveChallenge(null);
    }
    setChallenges(cachedChallenges);
    setChallengeLoadError('');
    setIsLoadingChallenges(!cachedLoaded);

    if (cachedLoaded) return;

    try {
      const loadedChallenges = await loadChallengesForCourse(courseId);
      if (loadRequestRef.current !== requestId) return;
      setChallenges(loadedChallenges);
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;
      if (import.meta.env.DEV) {
        console.warn('[ChallengesPanel] challenge load failed:', error);
      }
      setChallengeLoadError(CHALLENGE_LOAD_ERROR_COPY);
    } finally {
      if (loadRequestRef.current === requestId) {
        setIsLoadingChallenges(false);
      }
    }
  }, [courseId]);

  useEffect(() => {
    void refreshChallengeList({ resetActive: true });

    return () => {
      loadRequestRef.current += 1;
    };
  }, [refreshChallengeList]);

  if (activeChallenge) {
    return (
      <div className="panel-overlay" onClick={onClose}>
        <div
          ref={modalRef}
          className="panel challenges-panel wide"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Challenge: ${activeChallenge.title}`}
          tabIndex={-1}
        >
          <div className="panel-head">
            <div className="panel-title-group">
              <p className="panel-kicker">Hands-on build</p>
              <h2 className="panel-title">{activeChallenge.title}</h2>
            </div>
            <div className="panel-head-actions">
              <button
                type="button"
                className="panel-back"
                onClick={() => setActiveChallenge(null)}
                aria-label="Back to challenge list"
              >
                Back to list
              </button>
              <button type="button" className="panel-close" onClick={onClose} aria-label="Close challenges">
                ×
              </button>
            </div>
          </div>
          <div className="panel-body">
            <p className="panel-meta">
              Work through the prompt, run the tests, and keep iterating until the challenge clicks.
            </p>
            <p className="panel-meta">{PROGRESS_SYNC_COPY}</p>
            <p className="panel-meta panel-meta-trust">
              Completion is CodeHerWay app progress in this browser, not external verification.
            </p>
            <section
              className={`challenge-evidence ${activeEvidence.isCompleted ? 'is-complete' : ''}`}
              aria-label="Challenge evidence summary"
            >
              <div className="challenge-evidence-head">
                <div>
                  <p className="challenge-evidence-kicker">Evidence summary</p>
                  <h3 className="challenge-evidence-title">{activeEvidence.statusLabel}</h3>
                  <p className="challenge-evidence-copy">{activeEvidence.statusDetail}</p>
                </div>
                <div className="challenge-evidence-pills" aria-label="Evidence scope">
                  {activeEvidence.proofItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              {activeEvidence.capabilityItems.length > 0 && (
                <div className="challenge-evidence-grid">
                  <div>
                    <p className="challenge-evidence-label">Skill evidence</p>
                    <ul className="challenge-evidence-list">
                      {activeEvidence.capabilityItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="challenge-evidence-label">Definition of done</p>
                    <ul className="challenge-evidence-list">
                      {activeEvidence.rubricItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="challenge-evidence-label">Portfolio reflection</p>
                    <ul className="challenge-evidence-list">
                      {activeEvidence.reflectionPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
            <CodeChallenge
              challenge={activeChallenge}
              lang={lang}
              onComplete={() => {
                trackEvent('challenge_completed', getChallengeAnalyticsPayload({
                  challenge: activeChallenge,
                  courseId,
                  source: 'workspace',
                  isCompleted: completed.has(activeChallenge?.id),
                }));
                // completeChallenge is async (it awaits awardRewardOnce),
                // but we deliberately don't block the UI on reward sync —
                // see the commit history around 'prevent reward processing
                // from blocking lesson navigation'. Catch here so that an
                // unexpected throw (network timeout, throw inside the
                // backend reward path) doesn't surface as an unhandled
                // promise rejection. Promise.resolve() wraps the call so
                // a sync return (mocks, future early-return path) is
                // tolerated too.
                Promise.resolve(learn.completeChallenge(activeChallenge.id))
                  .catch((error) => {
                    if (import.meta.env.DEV) {
                      console.warn('[ChallengesPanel] completeChallenge failed:', error);
                    }
                  });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="panel challenges-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Code challenges"
        tabIndex={-1}
      >
        <div className="panel-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Practice lab</p>
            <h2 className="panel-title">Code Challenges</h2>
          </div>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close challenges">
            ×
          </button>
        </div>
        <div className="panel-body">
          <p className="panel-meta">
            Pick a challenge when you want to turn a lesson into something tangible and testable.
          </p>
          <p className="panel-meta">{PROGRESS_SYNC_COPY}</p>
          <p className="panel-meta panel-meta-trust">
            Completed labels reflect same-browser CodeHerWay progress. XP and badges stay motivational unless backend reward sync is enabled and verified.
          </p>

          {challengeLoadError ? (
            <div className="challenges-empty" role="alert" aria-live="assertive">
              <p><strong>Challenges could not load right now.</strong></p>
              <p className="challenges-empty-sub">
                {challengeLoadError}
              </p>
              <button
                type="button"
                className="panel-back"
                onClick={() => void refreshChallengeList()}
              >
                Try again
              </button>
            </div>
          ) : isLoadingChallenges ? (
            <div className="challenges-empty" role="status" aria-live="polite" aria-busy="true">
              <p><strong>Loading the challenge lab...</strong></p>
              <p className="challenges-empty-sub">
                Pulling in the hands-on practice track for this course.
              </p>
            </div>
          ) : challenges.length === 0 ? (
            <div className="challenges-empty">
              <p><strong>No challenges are live for this course yet.</strong></p>
              <p className="challenges-empty-sub">
                Keep moving through the lessons for now. When a challenge is available,
                it will appear here without changing your current progress.
              </p>
            </div>
          ) : (
            <>
              {challengePlan.recommended && (
                <div className="challenge-path-card">
                  <div>
                    <p className="challenge-path-kicker">Practice match</p>
                    <h3 className="challenge-path-title">{challengePlan.recommended.title}</h3>
                    <p className="challenge-path-copy">
                      {challengePlan.recommended.readinessLabel}. Best connected to{' '}
                      <strong>{challengePlan.recommended.targetModuleTitle}</strong>.
                    </p>
                    <ul className="challenge-path-reasons" aria-label="Recommended challenge readiness">
                      {challengePlan.recommended.readinessReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <p className="challenge-path-guidance">
                      {challengePlan.recommended.nextPracticeStep}
                    </p>
                    <p className="challenge-path-meta">
                      {challengePlan.completedCount}/{challengePlan.totalCount} challenges complete
                    </p>
                  </div>
                  <button
                    type="button"
                    className="challenge-path-cta"
                    onClick={() => openChallenge(challengePlan.recommended, 'recommendation')}
                    aria-label={`Start recommended challenge: ${challengePlan.recommended.title}`}
                  >
                    Start recommended
                  </button>
                </div>
              )}
              {completed.size === 0 && (
                <div className="challenges-empty challenges-empty-compact">
                  <p><strong>No completed challenges yet.</strong></p>
                  <p className="challenges-empty-sub">
                    Start with one beginner challenge when you want practice beyond the lesson.
                  </p>
                </div>
              )}
              <div className="challenges-list">
                {challengePlan.challenges.map((challenge) => (
                  <button
                    type="button"
                    key={challenge.id}
                    className={`challenge-card ${completed.has(challenge.id) ? 'done' : ''}`}
                    onClick={() => openChallenge(challenge, 'list')}
                  >
                    <div className="challenge-card-top">
                      <span className={`challenge-card-icon ${completed.has(challenge.id) ? 'is-done' : 'is-open'}`}>
                        {completed.has(challenge.id) ? '✓' : 'Start'}
                      </span>
                      <span className={`cc-diff cc-diff-${challenge.difficulty}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <h4 className="challenge-card-title">{challenge.title}</h4>
                    <p className="challenge-card-desc">{challenge.description}</p>
                    <p className="challenge-card-target">
                      {challenge.readinessLabel}: {challenge.targetModuleTitle}
                    </p>
                    <p className="challenge-card-guidance">
                      {challenge.nextPracticeStep}
                    </p>
                    <div className="challenge-card-meta">
                      <span>{challenge.evidenceLabel}</span>
                      <span>{completed.has(challenge.id) ? 'Completed here' : 'Open challenge'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
