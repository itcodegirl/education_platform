import { useState, useEffect, useRef, useCallback } from 'react';
import { useProgressData } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const BREAK_THRESHOLD = 5;

export function BreakPrompt() {
  const { completed = [] } = useProgressData();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const sessionStart = useRef(completed.length);
  const modalRef = useRef(null);

  const dismiss = useCallback(() => {
    setShow(false);
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const sessionCount = completed.length - sessionStart.current;
    if (sessionCount >= BREAK_THRESHOLD) {
      setShow(true);
    }
  }, [completed.length, dismissed]);

  useFocusTrap(modalRef, { enabled: show && !dismissed, onEscape: dismiss });

  if (!show || dismissed) return null;

  return (
    <div className="break-overlay" onClick={dismiss}>
      <div
        ref={modalRef}
        className="break-card"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="break-prompt-title"
        aria-describedby="break-prompt-msg break-prompt-sub"
        tabIndex={-1}
      >
        <span className="break-icon" aria-hidden="true">PAUSE</span>
        <h3 id="break-prompt-title" className="break-title">You&apos;re on a roll!</h3>
        <p id="break-prompt-msg" className="break-msg">
          You&apos;ve completed {BREAK_THRESHOLD}+ lessons this session. Your brain absorbs more when you take breaks between study sessions.
        </p>
        <p id="break-prompt-sub" className="break-sub">
          Consider stepping away for a bit. Your streak will still be here when you get back.
        </p>
        <div className="break-actions">
          <button type="button" className="break-continue" onClick={dismiss}>
            I&apos;m good, keep going
          </button>
          <button type="button" className="break-rest" onClick={dismiss}>
            Good idea, I&apos;ll take a break
          </button>
        </div>
      </div>
    </div>
  );
}
