import { useRef, useState } from 'react';
import { getChallengesForCourse } from '../../data/challenges';
import { CodeChallenge } from '../learning/CodeChallenge';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function ChallengesPanel({ courseId, lang, onClose }) {
  const challenges = getChallengesForCourse(courseId);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const modalRef = useRef(null);

  useFocusTrap(modalRef, { enabled: true, onEscape: onClose });

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
            <CodeChallenge
              challenge={activeChallenge}
              lang={lang}
              onComplete={() => {
                setCompleted((previous) => new Set([...previous, activeChallenge.id]));
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

          {challenges.length === 0 ? (
            <div className="challenges-empty">
              <p>No challenges are live for this course yet.</p>
              <p className="challenges-empty-sub">
                Keep moving through lessons for now and check back when the next practice drop lands.
              </p>
            </div>
          ) : (
            <div className="challenges-list">
              {challenges.map((challenge) => (
                <button
                  type="button"
                  key={challenge.id}
                  className={`challenge-card ${completed.has(challenge.id) ? 'done' : ''}`}
                  onClick={() => setActiveChallenge(challenge)}
                >
                  <div className="challenge-card-top">
                    <span className="challenge-card-icon">
                      {completed.has(challenge.id) ? '✓' : '🏆'}
                    </span>
                    <span className={`cc-diff cc-diff-${challenge.difficulty}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <h4 className="challenge-card-title">{challenge.title}</h4>
                  <p className="challenge-card-desc">{challenge.description}</p>
                  <div className="challenge-card-meta">
                    <span>{challenge.tests?.length || 0} tests</span>
                    <span>{completed.has(challenge.id) ? 'Completed' : 'Open challenge'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
