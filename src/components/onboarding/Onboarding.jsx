import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { trackEvent } from '../../lib/analytics';

const STEPS = [
  {
    icon: '01',
    eyebrow: 'Start here',
    title: 'Welcome to CodeHerWay',
    subtitle: 'Learn by shipping something real, not by getting trapped in endless theory.',
    points: [
      'Four complete learning tracks: HTML, CSS, JavaScript, and React.',
      'Project-first lessons that show the code, the result, and the reasoning.',
      'Built with the perspective of a self-taught developer who knows the messy middle.',
    ],
  },
  {
    icon: '02',
    eyebrow: 'Your toolkit',
    title: 'Every lesson comes with support',
    subtitle: 'You should never have to choose between guessing and giving up.',
    points: [
      'Monaco editor and live previews so you can write and test real code inside each lesson.',
      'AI tutor support that stays grounded in the current lesson when you get stuck.',
      'Tasks, challenges, and check-ins that normalize mistakes and build skill.',
    ],
  },
  {
    icon: '03',
    eyebrow: 'Your momentum',
    title: 'Your momentum stays visible',
    subtitle: 'The signed-in shell is designed to help you continue, review, and finish.',
    points: [
      'Bookmarks, glossary, cheat sheets, and search make it easy to return quickly.',
      'Review Queue and challenges turn gaps into deliberate practice instead of frustration.',
      'Progress, streaks, and badges celebrate consistency without pretending learning is linear.',
    ],
  },
];

export function Onboarding({ isOpen, onClose, displayName }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [, setOnboarded] = useLocalStorage('chw-onboarded', false);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const headingId = useId();
  const subtitleId = useId();
  const progressTextId = useId();

  const handleFinish = useCallback((reason = 'dismissed') => {
    trackEvent('onboarding_closed', {
      reason,
      step: step + 1,
      totalSteps: STEPS.length,
    });
    setOnboarded(true);
    onClose();
  }, [onClose, setOnboarded, step]);

  useFocusTrap(dialogRef, {
    enabled: isOpen,
    onEscape: handleFinish,
    initialFocus: 'first-tabbable',
  });

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
    if (isOpen && show && headingRef.current) {
      headingRef.current.focus();
    }
  }, [isOpen, show, step]);

  useEffect(() => {
    if (!isOpen) return;
    trackEvent('onboarding_opened', {
      step: step + 1,
      totalSteps: STEPS.length,
    });
  }, [isOpen, step]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="ob-overlay">
      <div
        ref={dialogRef}
        className={`ob-card ${show ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={`${subtitleId} onboarding-kicker ${progressTextId}`}
        tabIndex={-1}
      >
        <p
          id={progressTextId}
          className="ob-a11y-status"
          role="status"
          aria-live="polite"
        >
          Step {step + 1} of {STEPS.length}
        </p>

        <div
          className="ob-dots"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-describedby={progressTextId}
        >
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`ob-dot ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
              aria-label={`Step ${index + 1}`}
            />
          ))}
        </div>

        <span className="ob-eyebrow">{current.eyebrow}</span>
        <div className="ob-icon">{current.icon}</div>

        <h2
          id={headingId}
          className="ob-title"
          ref={headingRef}
          tabIndex={-1}
        >
          {step === 0 && displayName ? `Welcome, ${displayName}!` : current.title}
        </h2>

        <p id={subtitleId} className="ob-subtitle">
          {current.subtitle}
        </p>

        <div className="ob-points">
          {current.points.map((point) => (
            <div key={point} className="ob-point">
              <span className="ob-point-bullet">-</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        <p id="onboarding-kicker" className="ob-kicker">
          {isLast
            ? 'You are ready to start learning with context, support, and a workflow that keeps momentum visible.'
            : 'A few more seconds now makes the first session feel much more intuitive.'}
        </p>

        <div className="ob-actions">
          {!isFirst && (
            <button
              type="button"
              className="ob-back"
              onClick={() => {
                trackEvent('onboarding_step_back', { fromStep: step + 1, toStep: step });
                setStep((value) => value - 1);
              }}
              aria-label={`Back to step ${step}`}
            >
              Back
            </button>
          )}

          {!isLast && (
            <button
              type="button"
              className="ob-skip"
              onClick={() => handleFinish('skipped')}
              aria-label="Skip onboarding tour"
            >
              Skip tour
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              className="ob-start"
              onClick={() => handleFinish('completed')}
              aria-label="Start learning"
            >
              Start learning
            </button>
          ) : (
            <button
              type="button"
              className="ob-next"
              onClick={() => {
                trackEvent('onboarding_step_next', { fromStep: step + 1, toStep: step + 2 });
                setStep((value) => value + 1);
              }}
              aria-label={`Go to step ${step + 2}`}
            >
              Next
            </button>
          )}
        </div>

        <div className="ob-step-label">Step {step + 1} of {STEPS.length}</div>
      </div>
    </div>
  );
}

