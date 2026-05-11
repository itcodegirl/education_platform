import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLearnerLocalStorage } from '../../hooks/useLearnerLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { trackEvent } from '../../lib/analytics';

const STEPS = [
  {
    icon: '01',
    eyebrow: 'One path',
    title: 'Start with the lesson in front of you',
    subtitle: 'CodeHerWay works best when the first session stays simple.',
    points: [
      'Read the goal before the details so you know what you are building.',
      'Try the example and compare your screen to the result.',
      'Use Complete lesson when the idea clicks and you are ready for the next step.',
    ],
  },
  {
    icon: '02',
    eyebrow: 'Support',
    title: 'Use tools only when they help',
    subtitle: 'The lesson is the main path. Tools are there to reduce friction, not create homework.',
    points: [
      'Search and glossary help when a word or concept feels fuzzy.',
      'Notes and bookmarks are for ideas you want to return to.',
      'Practice tools unlock as next steps after you have learning momentum.',
    ],
  },
  {
    icon: '03',
    eyebrow: 'First session',
    title: 'Your first session has one path',
    subtitle: 'Start with the lesson in front of you, then let the next step reveal itself.',
    points: [
      'Read the goal.',
      'Try the build.',
      'Save reading progress with Complete lesson, then continue.',
    ],
  },
];

export function Onboarding({ isOpen, onClose, displayName }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [, setOnboarded] = useLearnerLocalStorage('chw-onboarded', false);
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
            ? 'You are ready to start with one calm loop: goal, build, complete, continue.'
            : 'A few more seconds now keeps the first session focused.'}
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

