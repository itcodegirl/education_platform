import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const STEPS = [
  {
    icon: '⚡',
    eyebrow: 'Start here',
    title: 'Welcome to CodeHerWay',
    subtitle: 'Learn by shipping something real, not by getting trapped in endless theory.',
    points: [
      'Four complete learning tracks: HTML, CSS, JavaScript, and React.',
      'Project-first lessons that show the code, the result, and the reasoning.',
      'Built with the honesty of a self-taught developer who remembers the messy middle.',
    ],
  },
  {
    icon: '✏️',
    eyebrow: 'Your toolkit',
    title: 'Every lesson comes with support',
    subtitle: 'You should never have to choose between guessing and giving up.',
    points: [
      'Monaco editor and live previews so you can write and test real code inside the lesson.',
      'AI Tutor support that stays grounded in the current lesson when you get stuck.',
      'Tasks, challenges, and Dev_Fessions that normalize mistakes while still building skill.',
    ],
  },
  {
    icon: '🏆',
    eyebrow: 'Your momentum',
    title: 'The product keeps you moving',
    subtitle: 'The signed-in shell is designed to help you continue, review, and finish.',
    points: [
      'Bookmarks, glossary, cheat sheets, and search make it easy to get back on track fast.',
      'Review Queue and challenges turn gaps into deliberate practice instead of shame spirals.',
      'Progress, streaks, and badges celebrate consistency without pretending learning is linear.',
    ],
  },
];

export function Onboarding({ isOpen, onClose, displayName }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [, setOnboarded] = useLocalStorage('chw-onboarded', false);

  const handleFinish = useCallback(() => {
    setOnboarded(true);
    onClose();
  }, [onClose, setOnboarded]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }

    setShow(false);
    setStep(0);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleFinish]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="ob-overlay">
      <div
        className={`ob-card ${show ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-subtitle onboarding-kicker"
      >
        <div className="ob-dots" aria-label="Onboarding progress" aria-live="polite">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`ob-dot ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
            />
          ))}
        </div>

        <span className="ob-eyebrow">{current.eyebrow}</span>
        <div className="ob-icon">{current.icon}</div>

        <h2 id="onboarding-title" className="ob-title">
          {step === 0 && displayName ? `Welcome, ${displayName}!` : current.title}
        </h2>

        <p id="onboarding-subtitle" className="ob-subtitle">
          {current.subtitle}
        </p>

        <div className="ob-points">
          {current.points.map((point) => (
            <div key={point} className="ob-point">
              <span className="ob-point-bullet">→</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        <p id="onboarding-kicker" className="ob-kicker">
          {isLast
            ? 'You are ready to start learning with context, support, and a product that keeps momentum visible.'
            : 'A few more seconds now makes the first session feel much more intuitive.'}
        </p>

        <div className="ob-actions">
          {!isFirst && (
            <button
              type="button"
              className="ob-back"
              onClick={() => setStep((value) => value - 1)}
              aria-label={`Go to step ${step}`}
            >
              ← Back
            </button>
          )}

          {isFirst && (
            <button type="button" className="ob-skip" onClick={handleFinish} aria-label="Skip onboarding tour">
              Skip tour
            </button>
          )}

          {isLast ? (
            <button type="button" className="ob-start" onClick={handleFinish} aria-label="Start learning">
              Start learning →
            </button>
          ) : (
            <button
              type="button"
              className="ob-next"
              onClick={() => setStep((value) => value + 1)}
              aria-label={`Go to step ${step + 2}`}
            >
              Next →
            </button>
          )}
        </div>

        <div className="ob-step-label">
          Step {step + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}
