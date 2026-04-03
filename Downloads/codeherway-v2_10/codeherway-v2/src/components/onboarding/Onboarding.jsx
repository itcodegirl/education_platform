// ═══════════════════════════════════════════════
// ONBOARDING — 3-step tour for first-time users
// Shows once, saved to localStorage
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';

const STEPS = [
  {
    icon: '⚡',
    title: 'Welcome to CodeHerWay',
    subtitle: 'Where women code, lead, and rewrite the future of tech.',
    points: [
      '4 complete courses: HTML, CSS, JavaScript, and React',
      '134 lessons with interactive code examples',
      'Built by a self-taught developer who gets it',
    ],
  },
  {
    icon: '✏️',
    title: 'Your Learning Toolkit',
    subtitle: 'Every lesson comes loaded with features.',
    points: [
      'Monaco Editor — write and run real code inside every lesson',
      'AI Tutor — ask questions and get instant, context-aware help',
      'Tasks & Challenges — practice with auto-graded exercises',
      'Dev_Fessions — real developer mistakes that normalize failure',
    ],
  },
  {
    icon: '🏆',
    title: 'Track Your Progress',
    subtitle: 'The bottom toolbar is your command center.',
    points: [
      '★ Bookmarks — save lessons to revisit later',
      '🏋️ Challenges — auto-graded coding exercises',
      '🔄 Review Queue — missed quiz questions come back',
      '📋 Cheat Sheets & 📖 Glossary — quick reference',
      '⌘K or 🔍 — search across all courses instantly',
      '☀️/🌙 — toggle dark and light mode',
    ],
  },
];

export function Onboarding({ isOpen, onClose, displayName }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      setStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleFinish = () => {
    localStorage.setItem('chw-onboarded', 'true');
    onClose();
  };

  return (
    <div className="ob-overlay">
      <div className={`ob-card ${show ? 'show' : ''}`}>
        {/* Progress dots */}
        <div className="ob-dots">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`ob-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="ob-icon">{current.icon}</div>

        <h2 className="ob-title">
          {step === 0 && displayName
            ? `Welcome, ${displayName}!`
            : current.title}
        </h2>

        <p className="ob-subtitle">{current.subtitle}</p>

        <div className="ob-points">
          {current.points.map((point, i) => (
            <div key={i} className="ob-point">
              <span className="ob-point-bullet">→</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="ob-actions">
          {!isFirst && (
            <button className="ob-back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}

          {isFirst && (
            <button className="ob-skip" onClick={handleFinish}>
              Skip tour
            </button>
          )}

          {isLast ? (
            <button className="ob-start" onClick={handleFinish}>
              Start Learning →
            </button>
          ) : (
            <button className="ob-next" onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          )}
        </div>

        {/* Step counter */}
        <div className="ob-step-label">
          {step + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}
