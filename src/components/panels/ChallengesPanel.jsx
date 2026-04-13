// ═══════════════════════════════════════════════
// CHALLENGES PANEL — Lists code challenges for current course
// Opens the CodeChallenge component inline
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { getChallengesForCourse } from '../../data/challenges';
import { CodeChallenge } from '../learning/CodeChallenge';

export function ChallengesPanel({ courseId, lang, onClose }) {
  const challenges = getChallengesForCourse(courseId);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completed, setCompleted] = useState(new Set());

  if (activeChallenge) {
    return (
      <div className="panel-overlay" onClick={onClose}>
        <div className="panel challenges-panel wide" onClick={(e) => e.stopPropagation()}>
          <div className="panel-head">
            <button type="button" className="panel-back" onClick={() => setActiveChallenge(null)}>
              ← Back to Challenges
            </button>
            <button type="button" className="panel-close" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <CodeChallenge
              challenge={activeChallenge}
              lang={lang}
              onComplete={() => {
                setCompleted(prev => new Set([...prev, activeChallenge.id]));
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel challenges-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3 className="panel-title">🏋️ Code Challenges</h3>
          <button type="button" className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {challenges.length === 0 ? (
            <div className="challenges-empty">
              <p>No challenges available for this course yet.</p>
              <p className="challenges-empty-sub">Check back soon!</p>
            </div>
          ) : (
            <div className="challenges-list">
              {challenges.map(ch => (
                <button type="button"
                  key={ch.id}
                  className={`challenge-card ${completed.has(ch.id) ? 'done' : ''}`}
                  onClick={() => setActiveChallenge(ch)}
                >
                  <div className="challenge-card-top">
                    <span className="challenge-card-icon">
                      {completed.has(ch.id) ? '✅' : '🏆'}
                    </span>
                    <span className={`cc-diff cc-diff-${ch.difficulty}`}>
                      {ch.difficulty}
                    </span>
                  </div>
                  <h4 className="challenge-card-title">{ch.title}</h4>
                  <p className="challenge-card-desc">{ch.description}</p>
                  <div className="challenge-card-meta">
                    <span>{ch.tests?.length || 0} tests</span>
                    <span>→</span>
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
