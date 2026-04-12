// ═══════════════════════════════════════════════
// BREAK PROMPT — Gentle reminder after 5+ lessons
// Encourages healthy study habits without being
// patronizing. Dismisses easily, won't re-show
// for the rest of the session.
// ═══════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../providers';

const BREAK_THRESHOLD = 5; // lessons in one session
const SESSION_KEY = 'chw-session-lessons';

export function BreakPrompt() {
  const { completed = [] } = useProgress();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const sessionStart = useRef(completed.length);

  useEffect(() => {
    if (dismissed) return;
    const sessionCount = completed.length - sessionStart.current;
    if (sessionCount >= BREAK_THRESHOLD) {
      setShow(true);
    }
  }, [completed.length, dismissed]);

  if (!show || dismissed) return null;

  return (
    <div className="break-overlay" onClick={() => { setShow(false); setDismissed(true); }}>
      <div className="break-card" onClick={(e) => e.stopPropagation()}>
        <span className="break-icon">☕</span>
        <h3 className="break-title">You&apos;re on a roll!</h3>
        <p className="break-msg">
          You&apos;ve completed {BREAK_THRESHOLD}+ lessons this session. Your brain absorbs more when you take breaks between study sessions.
        </p>
        <p className="break-sub">
          Consider stepping away for a bit — your streak will still be here when you get back.
        </p>
        <div className="break-actions">
          <button
            type="button"
            className="break-continue"
            onClick={() => { setShow(false); setDismissed(true); }}
          >
            I&apos;m good, keep going 💪
          </button>
          <button
            type="button"
            className="break-rest"
            onClick={() => { setShow(false); setDismissed(true); }}
          >
            Good idea, I&apos;ll take a break
          </button>
        </div>
      </div>
    </div>
  );
}
